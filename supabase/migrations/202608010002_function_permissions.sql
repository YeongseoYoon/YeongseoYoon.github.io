revoke all on function public.claim_identity(text, text, text) from public, anon;
revoke all on function public.save_draft(text, text, text, text, uuid) from public, anon;
revoke all on function public.release_creature(text, text, text, text, uuid) from public, anon;
revoke all on function public.update_creature_message(uuid, text) from public, anon;
revoke all on function public.delete_creature(uuid) from public, anon;
revoke all on function public.submit_report(uuid, text, text) from public, anon;
revoke all on function public.moderate_creature(uuid, text, text, text) from public, anon;

grant execute on function public.claim_identity(text, text, text) to authenticated;
grant execute on function public.save_draft(text, text, text, text, uuid) to authenticated;
grant execute on function public.release_creature(text, text, text, text, uuid) to authenticated;
grant execute on function public.update_creature_message(uuid, text) to authenticated;
grant execute on function public.delete_creature(uuid) to authenticated;
grant execute on function public.submit_report(uuid, text, text) to authenticated;
grant execute on function public.moderate_creature(uuid, text, text, text) to authenticated;

