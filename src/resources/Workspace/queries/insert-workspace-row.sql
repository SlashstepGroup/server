set search_path to app;

insert into workspaces (name, display_name, description) values ($1, $2, $3) returning *;