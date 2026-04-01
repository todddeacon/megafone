-- Allow claim requests for organisations not yet in the system
alter table claim_requests
  alter column organisation_id drop not null;

alter table claim_requests
  add column organisation_other text null;
