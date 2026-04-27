-- Checklist Azura: Database Schema (Supabase/PostgreSQL)

-- 1. Organizations (Multi-tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (Extended Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'manager', 'staff')),
    organization_id UUID REFERENCES organizations(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Checklist Templates
CREATE TABLE checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    title TEXT NOT NULL,
    category TEXT,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- 4. Checklist Items
CREATE TABLE checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('boolean', 'numeric', 'photo', 'text')),
    is_mandatory BOOLEAN DEFAULT TRUE,
    min_value NUMERIC,
    max_value NUMERIC,
    sort_order INT DEFAULT 0
);

-- 5. Submissions
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES checklist_templates(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'alert')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 6. Item Responses
CREATE TABLE item_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES checklist_items(id),
    value TEXT, -- JSON string or raw value
    photo_url TEXT,
    comment TEXT,
    action_plan TEXT, -- Required if non-conformity detected
    is_conform BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS Policy (Row Level Security) - Basic multi-tenant example
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see templates from their organization" 
ON checklist_templates FOR ALL
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Repeat RLS for all tables targeting organization_id
