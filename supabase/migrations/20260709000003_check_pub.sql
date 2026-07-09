create or replace function debug_publication_tables()
returns table(pubname name, tablename name) as $$
  select p.pubname, c.relname
  from pg_publication p
  join pg_publication_rel pr on pr.prpubid = p.oid
  join pg_class c on c.oid = pr.prrelid
  where p.pubname = 'supabase_realtime';
$$ language sql security definer;
