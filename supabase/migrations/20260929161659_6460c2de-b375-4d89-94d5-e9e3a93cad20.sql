create or replace function public.exec_sql(q text, returns_rows boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare result jsonb;
begin
  if returns_rows then
    if q ~* '^\s*\(*\s*(select|with|values)\b' then
      execute 'select coalesce(jsonb_agg(t), ''[]''::jsonb) from (' || q || ') t' into result;
    else
      execute 'with t as (' || q || ') select coalesce(jsonb_agg(t), ''[]''::jsonb) from t' into result;
    end if;
    return coalesce(result, '[]'::jsonb);
  end if;
  execute q;
  return '[]'::jsonb;
end;
$fn$;
revoke all on function public.exec_sql(text, boolean) from public, anon, authenticated;
grant execute on function public.exec_sql(text, boolean) to service_role;