create table programs (
 id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''), name text not null check(btrim(name)<>''),
 owner text not null check(btrim(owner)<>''), kind text not null check(kind in ('exercise','coordination')),
 status text not null default 'active' check(status in ('active','closed')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table sites (
 id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''), name text not null check(btrim(name)<>''),
 owner text not null check(btrim(owner)<>''), jurisdiction text not null check(jurisdiction in ('NZ','AU','other')),
 plan_ref text not null default '', evacuation_ref text not null default '', notification_ref text not null default '', medical_ref text not null default '', communication_ref text not null default '', training_ref text not null default '', test_ref text not null default '',
 test_interval_days integer check(test_interval_days between 1 and 3650), last_test date, review_due date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table resources (
 id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''), name text not null check(btrim(name)<>''), site_id uuid not null references sites(id),
 item text not null check(btrim(item)<>''), unit text not null check(btrim(unit)<>''), quantity integer not null check(quantity>=0), inspection_due date not null,
 state text not null default 'available' check(state in ('available','withdrawn')), owner text not null check(btrim(owner)<>''),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table requests (
 id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''), name text not null check(btrim(name)<>''), program_id uuid not null references programs(id), site_id uuid not null references sites(id),
 item text not null check(btrim(item)<>''), unit text not null check(btrim(unit)<>''), quantity integer not null check(quantity>0),
 owner text not null check(btrim(owner)<>''), due date not null, priority text not null check(priority in ('routine','urgent')),
 status text not null default 'new' check(status in ('new','approved','fulfilled','cancelled')),
 approved_by text, approval_note text, approved_at timestamptz, source text, external_id text, source_status text, source_record jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(source,external_id), check((status not in ('approved','fulfilled')) or (approved_at is not null and nullif(btrim(approved_by),'') is not null and nullif(btrim(approval_note),'') is not null))
);
create table allocations (
 id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''), request_id uuid not null references requests(id), resource_id uuid not null references resources(id),
 quantity integer not null check(quantity>0), status text not null default 'reserved' check(status in ('reserved','received','cancelled')),
 receipt_ref text, received_by text, received_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status<>'received' or (nullif(btrim(receipt_ref),'') is not null and nullif(btrim(received_by),'') is not null and received_at is not null))
);
create table actions (
 id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''), name text not null check(btrim(name)<>''), program_id uuid not null references programs(id),
 owner text not null check(btrim(owner)<>''), due date not null, status text not null default 'open' check(status in ('open','closed')), evidence text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(status<>'closed' or nullif(btrim(evidence),'') is not null)
);
create table events (
 id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id uuid not null, actor text not null check(btrim(actor)<>''), action text not null, detail jsonb not null,
 created_at timestamptz not null default now()
);
create table imports (
 id uuid primary key default gen_random_uuid(), source text not null, file_hash text not null, row_count integer not null, actor text not null, created_at timestamptz not null default now(), unique(source,file_hash)
);
create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
create function immutable_event() returns trigger language plpgsql as $$ begin raise exception 'Event history is append-only'; end $$;
create trigger events_immutable before update or delete on events for each row execute function immutable_event();
do $$ declare t text; begin
 foreach t in array array['programs','sites','resources','requests','allocations','actions'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
 execute format('create unique index %I on %I (lower(code))',t||'_code_ci',t);
 end loop;
 foreach t in array array['programs','sites','resources','requests','allocations','actions','events','imports'] loop
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
end $$;
create index allocations_request on allocations(request_id);
create index allocations_resource on allocations(resource_id);
create index events_entity on events(entity_type,entity_id,created_at);
create view resource_balance as
 select r.id,r.code,r.name,s.code as site,r.item,r.unit,r.quantity,
 coalesce(sum(a.quantity) filter(where a.status='reserved'),0)::integer as reserved,
 coalesce(sum(a.quantity) filter(where a.status='received'),0)::integer as received,
 (r.quantity-coalesce(sum(a.quantity) filter(where a.status in ('reserved','received')),0))::integer as available,
 r.inspection_due,r.state,r.owner
 from resources r join sites s on s.id=r.site_id left join allocations a on a.resource_id=r.id group by r.id,s.code;
create view request_queue as
 select q.id,q.code,q.name,p.code as program,s.code as site,q.item,q.unit,q.quantity,q.priority,q.owner,q.due,q.status,
 coalesce(sum(a.quantity) filter(where a.status='reserved'),0)::integer as reserved,
 coalesce(sum(a.quantity) filter(where a.status='received'),0)::integer as received,
 (q.quantity-coalesce(sum(a.quantity) filter(where a.status in ('reserved','received')),0))::integer as unallocated,
 q.approved_by,q.source,q.external_id,q.source_status
 from requests q join programs p on p.id=q.program_id join sites s on s.id=q.site_id left join allocations a on a.request_id=q.id group by q.id,p.code,s.code;
create view readiness as
 select id,code,name,owner,jurisdiction,review_due,last_test,test_interval_days,
 case when last_test is not null and test_interval_days is not null then last_test+test_interval_days end as next_test,
 concat_ws('; ',case when plan_ref='' then 'plan reference missing' end,
 case when evacuation_ref='' then 'evacuation evidence missing' end,case when notification_ref='' then 'notification evidence missing' end,
 case when medical_ref='' then 'medical assistance evidence missing' end,case when communication_ref='' then 'communication evidence missing' end,
 case when training_ref='' then 'training evidence missing' end,case when test_ref='' then 'test record missing' end,case when review_due is null then 'review date missing' when review_due<current_date then 'plan review overdue' end,
 case when test_interval_days is null then 'testing frequency missing' when last_test is null then 'testing evidence missing' when last_test+test_interval_days<current_date then 'plan-defined test overdue' end) as gaps
 from sites;
create view attention as
 select 'request'::text as kind,code,name,owner,due,'request overdue'::text as reason from requests where status in ('new','approved') and due<current_date
 union all select 'resource',code,name,owner,inspection_due,'inspection overdue' from resources where inspection_due<current_date and state='available'
 union all select 'action',code,name,owner,due,'exercise action overdue' from actions where status='open' and due<current_date
 union all select 'site',code,name,owner,review_due,gaps from readiness where gaps<>'';
revoke all on resource_balance,request_queue,readiness,attention from public;
