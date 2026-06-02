alter table clients add column if not exists step_goal integer default null;
alter table clients add column if not exists prev_step_goal integer default null;
