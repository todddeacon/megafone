-- Track pending organisations suggested by campaign creators
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS is_pending boolean NOT NULL DEFAULT false;

-- Track which user suggested a pending org and any contact they provided
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS suggested_by uuid null;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS suggested_contact_name text null;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS suggested_contact_email text null;
