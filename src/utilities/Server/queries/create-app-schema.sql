create schema if not exists app;

alter role current_user set search_path to app;

set search_path to app;