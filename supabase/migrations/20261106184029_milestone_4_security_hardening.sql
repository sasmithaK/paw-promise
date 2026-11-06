-- Enforce the same event and report integrity rules for direct Data API calls
-- that the application validates with Zod.

alter table public.event_participants
  add constraint event_participant_name_length check (
    participant_name is null or char_length(trim(participant_name)) between 1 and 120
  ),
  add constraint event_participant_context_length check (
    context is null or char_length(context) <= 160
  );

alter table public.event_attachments
  add constraint event_attachment_type_length check (
    attachment_type is null or char_length(attachment_type) <= 100
  );

alter table public.reports
  add constraint report_reason_length check (char_length(trim(reason)) between 3 and 160),
  add constraint report_description_length check (
    description is null or char_length(description) <= 2000
  );

create or replace function private.validate_event_payload()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if nullif(trim(new.title), '') is null or char_length(trim(new.title)) > 160 then
    raise exception 'The event title must contain between 1 and 160 characters';
  end if;
  if new.description is not null and char_length(new.description) > 4000 then
    raise exception 'The event description must not exceed 4000 characters';
  end if;
  if new.location_label is not null and char_length(new.location_label) > 200 then
    raise exception 'The event location must not exceed 200 characters';
  end if;
  if new.occurred_at > now() + interval '5 minutes' then
    raise exception 'The event time cannot be in the future';
  end if;
  if jsonb_typeof(new.details) <> 'object' then
    raise exception 'Event details must be an object';
  end if;

  case new.event_type
    when 'FEEDING' then
      if nullif(trim(new.details->>'foodType'), '') is null then
        raise exception 'Feeding events require a food type';
      end if;
      if new.details ? 'quantity' and (
        jsonb_typeof(new.details->'quantity') <> 'number'
        or (new.details->>'quantity')::numeric <= 0
      ) then
        raise exception 'Feeding quantity must be a positive number';
      end if;
      if new.details ? 'waterProvided'
        and jsonb_typeof(new.details->'waterProvided') <> 'boolean' then
        raise exception 'Water provided must be a boolean';
      end if;
    when 'HEALTH_OBSERVATION' then
      if jsonb_typeof(new.details->'observedSigns') <> 'array'
        or jsonb_array_length(new.details->'observedSigns') < 1
        or jsonb_array_length(new.details->'observedSigns') > 20 then
        raise exception 'Health observations require between 1 and 20 observed signs';
      end if;
      if coalesce((new.details->>'professionalDiagnosis')::boolean, false) then
        raise exception 'Community observations cannot claim a professional diagnosis';
      end if;
    when 'VETERINARY_VISIT' then
      if nullif(trim(new.details->>'providerName'), '') is null then
        raise exception 'Veterinary visits require a provider name';
      end if;
    when 'VACCINATION' then
      if nullif(trim(new.details->>'vaccineName'), '') is null then
        raise exception 'Vaccination events require a vaccine name';
      end if;
    when 'STERILISATION' then
      if coalesce(new.details->>'procedureStatus', '') not in ('COMPLETED', 'SCHEDULED', 'UNKNOWN') then
        raise exception 'Sterilisation events require a valid procedure status';
      end if;
    when 'RESCUE' then
      if nullif(trim(new.details->>'outcome'), '') is null then
        raise exception 'Rescue events require an outcome';
      end if;
    else
      null;
  end case;

  return new;
end;
$$;

revoke all on function private.validate_event_payload() from public, anon, authenticated;

create trigger validate_dog_event_payload
before insert or update on public.dog_events
for each row execute function private.validate_event_payload();

create policy "Event reports must reference a visible matching event"
on public.reports
as restrictive for insert
to authenticated
with check (
  event_id is null
  or exists (
    select 1
    from public.dog_events event
    where event.id = reports.event_id
      and (reports.dog_id is null or reports.dog_id = event.dog_id)
  )
);
