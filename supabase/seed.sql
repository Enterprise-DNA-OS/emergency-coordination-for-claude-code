insert into programs(id,code,name,owner,kind) values
 ('10000000-0000-4000-8000-000000000001','EX-01','Harbour supply exercise','Morgan Ellis','exercise'),
 ('10000000-0000-4000-8000-000000000002','EX-02','North depot exercise','Avery Cole','exercise') on conflict do nothing;
insert into sites(id,code,name,owner,jurisdiction,plan_ref,evacuation_ref,notification_ref,medical_ref,communication_ref,training_ref,test_ref,test_interval_days,last_test,review_due) values
 ('20000000-0000-4000-8000-000000000001','HUB','Harbour reception hub','Morgan Ellis','NZ','PLAN-H-3','EVAC-H-3','NOTIFY-H-2','FIRST-H-2','COMMS-H-4','TRAIN-H-2026','TEST-H-2026',90,current_date-30,current_date+60),
 ('20000000-0000-4000-8000-000000000002','DEPOT','North supply depot','Avery Cole','NZ','PLAN-N-1','','NOTIFY-N-1','','COMMS-N-1','','',90,current_date-120,current_date-10),
 ('20000000-0000-4000-8000-000000000003','SOUTH','South reception hub','Casey Reed','AU','PLAN-S-1','EVAC-S-1','NOTIFY-S-1','FIRST-S-1','COMMS-S-1','TRAIN-S-1','TEST-S-1',180,current_date-20,current_date+90) on conflict do nothing;
insert into resources(id,code,name,site_id,item,unit,quantity,inspection_due,owner) values
 ('30000000-0000-4000-8000-000000000001','WATER-N','North drinking-water stock','20000000-0000-4000-8000-000000000002','drinking water','carton',100,current_date+60,'Avery Cole'),
 ('30000000-0000-4000-8000-000000000002','WATER-S','South drinking-water stock','20000000-0000-4000-8000-000000000003','drinking water','carton',40,current_date-2,'Casey Reed'),
 ('30000000-0000-4000-8000-000000000003','BLANKET-N','North blanket stock','20000000-0000-4000-8000-000000000002','blanket','each',80,current_date+60,'Avery Cole') on conflict do nothing;
insert into requests(id,code,name,program_id,site_id,item,unit,quantity,owner,due,priority,status,approved_by,approval_note,approved_at) values
 ('40000000-0000-4000-8000-000000000001','REQ-01','Water for harbour exercise','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','drinking water','carton',60,'Morgan Ellis',current_date-2,'urgent','approved','Taylor Brooks','Exercise controller confirmed quantity',now()),
 ('40000000-0000-4000-8000-000000000002','REQ-02','Blankets for harbour exercise','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','blanket','each',30,'Morgan Ellis',current_date+2,'routine','new',null,null,null),
 ('40000000-0000-4000-8000-000000000003','REQ-03','Water for north exercise','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','drinking water','carton',70,'Avery Cole',current_date+1,'routine','new',null,null,null) on conflict do nothing;
insert into allocations(id,code,request_id,resource_id,quantity) values
 ('50000000-0000-4000-8000-000000000001','ALLOC-01','40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',20) on conflict do nothing;
insert into actions(id,code,name,program_id,owner,due) values
 ('60000000-0000-4000-8000-000000000001','ACT-01','Confirm alternate depot communication route','10000000-0000-4000-8000-000000000001','Avery Cole',current_date-3),
 ('60000000-0000-4000-8000-000000000002','ACT-02','Record exercise receipt handover','10000000-0000-4000-8000-000000000002','Morgan Ellis',current_date+3) on conflict do nothing;
insert into events(id,entity_type,entity_id,actor,action,detail) values
 ('70000000-0000-4000-8000-000000000001','programs','10000000-0000-4000-8000-000000000001','Demo seed','seed','{"note":"Fictional exercise records. No real incident."}') on conflict do nothing;
