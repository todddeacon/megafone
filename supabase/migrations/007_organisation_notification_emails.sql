-- Replace single contact_email with a proper multi-email notification table

create table organisation_notification_emails (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisations (id) on delete cascade,
  email            text not null,
  label            text null,  -- e.g. rep's name, or a description like "Press office"
  source           text not null default 'manual',  -- 'manual' | 'org_rep'
  created_at       timestamp with time zone not null default now(),
  unique (organisation_id, email)
);

create index idx_org_notification_emails_org_id on organisation_notification_emails (organisation_id);

-- Migrate any existing contact_email values into the new table, then drop the column
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'organisations' and column_name = 'contact_email'
  ) then
    insert into organisation_notification_emails (organisation_id, email, source)
    select id, contact_email, 'manual'
    from organisations
    where contact_email is not null
    on conflict (organisation_id, email) do nothing;

    alter table organisations drop column contact_email;
  end if;
end $$;
