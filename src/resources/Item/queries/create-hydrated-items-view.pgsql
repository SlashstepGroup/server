create or replace view hydrated_items_view as 
  select 
    items.id,
    items.summary,
    items.description,
    items.number,
    items.project_id,
    projects.name as project_name,
    projects.display_name as project_display_name,
    projects.key as project_key,
    projects.description as project_description,
    projects.start_date as project_start_date,
    projects.end_date as project_end_date
  from 
    items
  inner join 
    projects on items.project_id = projects.id