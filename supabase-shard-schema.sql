-- ==============================================================================
-- NEXCHAT: nexchat-chat-X (CHAT SHARD PROJECT SCHEMA)
-- Architecture: Run this identical SQL script in each of the 7 Chat Shard projects:
--   Project 2: nexchat-chat-1 (Account 1)
--   Project 3: nexchat-chat-2 (Account 2)
--   Project 4: nexchat-chat-3 (Account 2)
--   Project 5: nexchat-chat-4 (Account 3)
--   Project 6: nexchat-chat-5 (Account 3)
--   Project 7: nexchat-chat-6 (Account 4)
--   Project 8: nexchat-chat-7 (Account 4)
-- ==============================================================================

-- 0. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. MESSAGES TABLE
-- High-speed message storage for groups and rooms hosted on this specific shard
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,                       -- 'group_<group_id>' or 'direct_<uidA>_<uidB>'
    group_id UUID,                              -- Group UUID (if group message)
    sender_id UUID NOT NULL,                    -- Sender profile UUID
    sender_name TEXT,                           -- Sender display name cache for fast rendering
    sender_avatar TEXT,                         -- Sender avatar cache
    recipient_id UUID,                          -- Recipient UUID (if direct message)
    text TEXT,                                  -- Message text (or encrypted ciphertext)
    attachment JSONB,                           -- Media payload { fileType, downloadURL, fileName, fileSize }
    reply_to JSONB,                             -- Quoted message preview
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
    read_by JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of reader UIDs for group read receipts
    reactions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Emoji reactions [{ emoji: '🔥', uids: [...] }]
    deleted_for JSONB NOT NULL DEFAULT '[]'::jsonb, -- UIDs who hid/deleted this message for themselves
    is_deleted_for_everyone BOOLEAN NOT NULL DEFAULT false,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    edited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for sub-5ms chat rendering
CREATE INDEX IF NOT EXISTS idx_messages_room_time ON public.messages(room_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_group_time ON public.messages(group_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON public.messages(room_id) WHERE is_pinned = true;

-- Full-Text Search GIN Index
CREATE INDEX IF NOT EXISTS idx_messages_search ON public.messages USING gin(to_tsvector('english', coalesce(text, '')));

-- ==============================================================================
-- 2. ENABLE SUPABASE REALTIME (CDC WebSockets for Phoenix Channels)
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable REPLICA IDENTITY FULL so UPDATEs transmit previous and new rows
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on messages"
    ON public.messages FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Allow authenticated insert on messages"
    ON public.messages FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on messages"
    ON public.messages FOR UPDATE
    TO authenticated, anon
    USING (true);

-- Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_message_updated_at ON public.messages;
CREATE TRIGGER trigger_message_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_message_updated_at();

COMMENT ON TABLE public.messages IS 'Sharded message storage for NEXCHAT chat shards';
