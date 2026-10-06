-- ==============================================================================
-- NEXCHAT SUPABASE REALTIME CHAT ENGINE SCHEMA
-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query)
-- ==============================================================================

-- 1. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    recipient_id TEXT,
    group_id TEXT,
    text TEXT,
    attachment JSONB,
    reply_to JSONB,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    reactions JSONB DEFAULT '[]'::jsonb,
    edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for Blazing Fast Queries (Sub-5ms response)
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON public.messages(room_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_group ON public.messages(group_id);

-- Full-Text Search GIN Index (Instant in-chat search)
CREATE INDEX IF NOT EXISTS idx_messages_fts ON public.messages USING gin(to_tsvector('english', coalesce(text, '')));

-- 3. Enable Supabase Realtime (CDC WebSocket replication)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 4. Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow public reads for messages in valid rooms (or customized with auth.uid())
CREATE POLICY "Allow public select on messages"
    ON public.messages
    FOR SELECT
    USING (true);

-- Allow public insert on messages (or verified by authenticated users)
CREATE POLICY "Allow public insert on messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (true);

-- Allow message updates for read receipts, reactions, and edits
CREATE POLICY "Allow public update on messages"
    ON public.messages
    FOR UPDATE
    USING (true);

-- 5. Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_messages_updated_at ON public.messages;
CREATE TRIGGER trigger_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Output Confirmation
COMMENT ON TABLE public.messages IS 'NEXCHAT Realtime messaging table powered by Supabase WebSockets';
