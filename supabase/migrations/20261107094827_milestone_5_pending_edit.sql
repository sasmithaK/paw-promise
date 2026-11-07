create or replace function public.update_pending_paw(
  p_dog_id uuid,
  p_name text,
  p_sex public.dog_sex,
  p_estimated_age text,
  p_breed text,
  p_colour text,
  p_size text,
  p_distinguishing_features text,
  p_found_at timestamptz,
  p_found_location_label text,
  p_vaccination_status text,
  p_sterilisation_status text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not private.current_user_is_active() then
    raise exception 'An active member session is required';
  end if;
  if p_found_at > now() + interval '5 minutes' then
    raise exception 'Discovery time cannot be in the future';
  end if;
  if nullif(trim(p_found_location_label), '') is null
    or char_length(trim(p_found_location_label)) > 200 then
    raise exception 'A locality between 1 and 200 characters is required';
  end if;
  if p_size not in ('UNKNOWN','SMALL','MEDIUM','LARGE') then raise exception 'Invalid size'; end if;
  if p_vaccination_status not in ('UNKNOWN','REPORTED','EVIDENCE_ATTACHED')
    or p_sterilisation_status not in ('UNKNOWN','REPORTED','EVIDENCE_ATTACHED') then
    raise exception 'Invalid care status';
  end if;

  update public.dogs
  set name = nullif(trim(p_name), ''),
      sex = p_sex,
      estimated_age = nullif(trim(p_estimated_age), ''),
      breed = nullif(trim(p_breed), ''),
      colour = nullif(trim(p_colour), ''),
      size = p_size,
      distinguishing_features = nullif(trim(p_distinguishing_features), ''),
      found_at = p_found_at,
      found_location_label = trim(p_found_location_label),
      vaccination_status = p_vaccination_status,
      sterilisation_status = p_sterilisation_status,
      changes_requested_by = null,
      changes_requested_at = null,
      changes_requested_note = null
  where id = p_dog_id and created_by = actor and record_status = 'PENDING';
  if not found then raise exception 'Only your own pending profile can be edited'; end if;
  return p_dog_id;
end;
$$;

revoke all on function public.update_pending_paw(uuid,text,public.dog_sex,text,text,text,text,text,timestamptz,text,text,text)
  from public, anon;
grant execute on function public.update_pending_paw(uuid,text,public.dog_sex,text,text,text,text,text,timestamptz,text,text,text)
  to authenticated;
