-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Marketing Targets Table (Crawled Data)
CREATE TABLE IF NOT EXISTS public.marketing_targets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Basic Info
    name TEXT,
    phone_number TEXT NOT NULL, -- Normalized (e.g., 01012345678)
    
    -- Business Info
    shop_name TEXT,
    industry TEXT, -- e.g., 'Restaurant', 'Bar'
    region_city TEXT, -- e.g., 'Seoul'
    region_gu TEXT,   -- e.g., 'Gangnam-gu'
    
    -- Source Info
    source_site TEXT, -- e.g., 'NaverMap', 'JobSiteA'
    source_url TEXT,
    
    -- Status
    status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted', 'bounced', 'opt_out'
    notes TEXT,
    
    -- Constraint to prevent duplicates
    CONSTRAINT marketing_targets_phone_unique UNIQUE (phone_number)
);

-- 2. Marketing Campaigns Table (Sending History)
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    title TEXT NOT NULL,
    message_content TEXT NOT NULL,
    channel TEXT NOT NULL, -- 'sms', 'lms', 'kakao', 'telegram'
    
    target_filter JSONB, -- Stores the criteria used (e.g., { region: 'Seoul' })
    recipient_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'failed'
    sent_at TIMESTAMPTZ
);

-- 3. Campaign Logs (Individual send results)
CREATE TABLE IF NOT EXISTS public.marketing_campaign_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    target_id UUID REFERENCES public.marketing_targets(id) ON DELETE SET NULL,
    
    status TEXT NOT NULL, -- 'success', 'failed'
    error_message TEXT
);

-- 4. Enable RLS
ALTER TABLE public.marketing_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaign_logs ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Admin Only)
-- Grant connection to authenticated users for now to simplify, 
-- but in production, this should be restricted to admins.
CREATE POLICY "Enable all access for authenticated users" ON public.marketing_targets
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.marketing_campaigns
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.marketing_campaign_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Grant permissions
GRANT ALL ON public.marketing_targets TO authenticated;
GRANT ALL ON public.marketing_targets TO service_role;

GRANT ALL ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;

GRANT ALL ON public.marketing_campaign_logs TO authenticated;
GRANT ALL ON public.marketing_campaign_logs TO service_role;
