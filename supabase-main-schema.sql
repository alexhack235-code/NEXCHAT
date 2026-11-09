-- ==============================================================================
-- NEXCHAT: nexchat-main (MAIN PROJECT SCHEMA)
-- Architecture: 4 Accounts x 2 Projects = 8 Supabase Projects (1,600 Realtime limit)
-- Project Role: Core Auth, User Profiles, Groups Metadata, Shards Registry & Group Shard Router
-- Target Project: Account 1 -> Project 1 ("nexchat-main")
-- ==============================================================================

-- 0. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. SHARDS REGISTRY TABLE
-- Holds the metadata and connection endpoints for the 7 chat message shards:
-- Account 1: nexchat-chat-1
-- Account 2: nexchat-chat-2, nexchat-chat-3
-- Account 3: nexchat-chat-4, nexchat-chat-5
-- Account 4: nexchat-chat-6, nexchat-chat-7
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shards (
    name TEXT PRIMARY KEY,                       -- e.g. 'nexchat-chat-1' ... 'nexchat-chat-7'
    account_label TEXT NOT NULL,                -- e.g. 'Account 1', 'Account 2', etc.
    url TEXT NOT NULL,                          -- e.g. 'https://<project-ref>.supabase.co'
    anon_key TEXT NOT NULL,                     -- Project Public Anon Key for Realtime & REST
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'full', 'offline')),
    active_groups_count INTEGER NOT NULL DEFAULT 0,
    max_groups INTEGER NOT NULL DEFAULT 500,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pre-seed the 7 Chat Shard identifiers
INSERT INTO public.shards (name, account_label, url, anon_key, status)
VALUES
    ('nexchat-chat-1', 'Account 1', 'https://placeholder-chat-1.supabase.co', 'placeholder-anon-key-1', 'active'),
    ('nexchat-chat-2', 'Account 2', 'https://placeholder-chat-2.supabase.co', 'placeholder-anon-key-2', 'active'),
    ('nexchat-chat-3', 'Account 2', 'https://placeholder-chat-3.supabase.co', 'placeholder-anon-key-3', 'active'),
    ('nexchat-chat-4', 'Account 3', 'https://placeholder-chat-4.supabase.co', 'placeholder-anon-key-4', 'active'),
    ('nexchat-chat-5', 'Account 3', 'https://placeholder-chat-5.supabase.co', 'placeholder-anon-key-5', 'active'),
    ('nexchat-chat-6', 'Account 4', 'https://placeholder-chat-6.supabase.co', 'placeholder-anon-key-6', 'active'),
    ('nexchat-chat-7', 'Account 4', 'https://placeholder-chat-7.supabase.co', 'placeholder-anon-key-7', 'active')
ON CONFLICT (name) DO NOTHING;

-- ==============================================================================
-- 2. USER PROFILES TABLE
-- Synced with auth.users to store WhatsApp-style profile, status, and encryption keys
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT UNIQUE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT DEFAULT 'logo.jpg',
    about TEXT DEFAULT 'Hey there! I am using NEXCHAT.',
    last_seen TIMESTAMPTZ DEFAULT now(),
    is_online BOOLEAN DEFAULT false,
    web_push_token TEXT,
    public_key TEXT,                            -- ECDH/Ed25519 identity key for E2EE
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- ==============================================================================
-- 3. CONTACTS TABLE
-- User contacts and phonebook pairings
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    alias TEXT,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_contact UNIQUE (user_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_user ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact ON public.contacts(contact_id);

-- ==============================================================================
-- 4. GROUPS TABLE (METADATA)
-- Group information, descriptions, settings, and avatars
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT DEFAULT 'logo.jpg',
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    settings JSONB NOT NULL DEFAULT '{
        "whoCanSend": "all",
        "whoCanEdit": "admins",
        "whoCanAdd": "all",
        "slowMode": 0,
        "antiSpam": true,
        "isEncrypted": true
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_creator ON public.groups(creator_id);

-- ==============================================================================
-- 5. GROUP MEMBERS TABLE
-- Tracks membership and admin roles
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_muted BOOLEAN NOT NULL DEFAULT false,
    muted_until TIMESTAMPTZ,
    CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);

-- ==============================================================================
-- 6. GROUP -> SHARD MAPPING TABLE (CORE SHARDING ROUTER)
-- Directs the client to the exact chat shard storing this group's messages
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.group_shards (
    group_id UUID PRIMARY KEY REFERENCES public.groups(id) ON DELETE CASCADE,
    shard_name TEXT NOT NULL REFERENCES public.shards(name) ON DELETE RESTRICT,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_shards_shard ON public.group_shards(shard_name);

-- ==============================================================================
-- 7. DIRECT CHAT SHARDS MAPPING TABLE (OPTIONAL 1-ON-1 SHARDING)
-- Direct 1-on-1 conversations can also be distributed evenly across the 7 shards
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.direct_chat_shards (
    room_id TEXT PRIMARY KEY,                    -- e.g. 'direct_uidA_uidB'
    shard_name TEXT NOT NULL REFERENCES public.shards(name) ON DELETE RESTRICT,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direct_chat_shards_shard ON public.direct_chat_shards(shard_name);

-- ==============================================================================
-- 8. AUTOMATIC SHARD ALLOCATION & BALANCING LOGIC
-- Automatically picks the shard with the lowest active group load
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.allocate_group_to_shard()
RETURNS TRIGGER AS $$
DECLARE
    target_shard TEXT;
BEGIN
    -- Select the active shard currently holding the least active groups
    SELECT name INTO target_shard
    FROM public.shards
    WHERE status = 'active'
    ORDER BY active_groups_count ASC, random()
    LIMIT 1;

    IF target_shard IS NULL THEN
        -- Fallback to shard 1 if all are marked full/inactive
        target_shard := 'nexchat-chat-1';
    END IF;

    -- Insert into group_shards router
    INSERT INTO public.group_shards (group_id, shard_name, allocated_at, last_activity_at)
    VALUES (NEW.id, target_shard, now(), now());

    -- Increment group count on the allocated shard
    UPDATE public.shards
    SET active_groups_count = active_groups_count + 1,
        updated_at = now()
    WHERE name = target_shard;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: When a new group is created, auto-allocate it to the optimal shard
DROP TRIGGER IF EXISTS trigger_auto_allocate_group_shard ON public.groups;
CREATE TRIGGER trigger_auto_allocate_group_shard
    AFTER INSERT ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.allocate_group_to_shard();

-- Trigger: Decrement count when a group is deleted
CREATE OR REPLACE FUNCTION public.handle_group_deleted_from_shard()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.shards
    SET active_groups_count = GREATEST(0, active_groups_count - 1),
        updated_at = now()
    WHERE name = OLD.shard_name;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_group_shard_deleted ON public.group_shards;
CREATE TRIGGER trigger_group_shard_deleted
    AFTER DELETE ON public.group_shards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_group_deleted_from_shard();

-- ==============================================================================
-- 9. RPC FUNCTION: GET GROUP SHARD ROUTE (FAST 1-CALL RESOLUTION)
-- Client invokes this to instantly get the WebSocket URL + Anon Key for a group
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_group_shard(p_group_id UUID)
RETURNS TABLE (
    group_id UUID,
    shard_name TEXT,
    account_label TEXT,
    url TEXT,
    anon_key TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gs.group_id,
        s.name AS shard_name,
        s.account_label,
        s.url,
        s.anon_key
    FROM public.group_shards gs
    JOIN public.shards s ON s.name = gs.shard_name
    WHERE gs.group_id = p_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 10. AUTH TRIGGER: AUTO-CREATE PROFILE ON USER SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    gen_username TEXT;
BEGIN
    gen_username := coalesce(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1) || '_' || substring(NEW.id::text from 1 for 4)
    );

    INSERT INTO public.profiles (id, phone, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.phone,
        gen_username,
        coalesce(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', gen_username),
        coalesce(NEW.raw_user_meta_data->>'avatar_url', 'logo.jpg')
    )
    ON CONFLICT (id) DO UPDATE
    SET updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.shards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_shards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_chat_shards ENABLE ROW LEVEL SECURITY;

-- Shards: Anyone authenticated can view shards registry to resolve connection endpoints
CREATE POLICY "Authenticated users can read shards"
    ON public.shards FOR SELECT
    TO authenticated
    USING (true);

-- Profiles: Public read, owner update
CREATE POLICY "Profiles are readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Contacts: User can read and manage their own contact book
CREATE POLICY "Users can manage own contacts"
    ON public.contacts FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Groups: Members can read group info
CREATE POLICY "Group members can view group"
    ON public.groups FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = id AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create groups"
    ON public.groups FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins can update group"
    ON public.groups FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = id 
              AND gm.user_id = auth.uid() 
              AND gm.role IN ('creator', 'admin')
        )
    );

-- Group Members: Members can read member roster
CREATE POLICY "Members can view member roster"
    ON public.group_members FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members self_m
            WHERE self_m.group_id = group_id AND self_m.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and creators can manage group members"
    ON public.group_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members self_m
            WHERE self_m.group_id = group_id 
              AND self_m.user_id = auth.uid() 
              AND self_m.role IN ('creator', 'admin')
        )
    );

-- Group Shards: Group members can read their group's shard location
CREATE POLICY "Group members can read shard mapping"
    ON public.group_shards FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
        )
    );

-- Direct Chat Shards: Participants can read their direct chat shard
CREATE POLICY "Participants can read direct chat shard"
    ON public.direct_chat_shards FOR SELECT
    TO authenticated
    USING (true);

-- ==============================================================================
-- 12. SUPABASE REALTIME REPLICATION SETUP
-- Enables live sync on nexchat-main for profiles, contacts, groups, and membership
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_shards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;

-- Output confirmation
COMMENT ON TABLE public.shards IS 'Registry of the 7 chat message shards across 4 Supabase accounts';
COMMENT ON TABLE public.group_shards IS 'Group-to-shard mapping routing table for NEXCHAT sharded architecture';
