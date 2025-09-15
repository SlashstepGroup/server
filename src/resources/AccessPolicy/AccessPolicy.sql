do $$ begin
  create type permissionLevel as enum (
    "None",
    "User",
    "Admin"
  );
exception
  when duplicate_object then null
end $$;

do $$ begin
  create type principalType as enum (
    "User",
    "Group"
  );
exception
  when duplicate_object then null
end $$;

do $$ begin
  create type scopeType as enum (
    "Instance",
    "Workspace",
    "Project",
    "Item"
  );
exception
  when duplicate_object then null
end $$;

create table if not exists accesspPolicies (
  id UUID default uuidv7() primary key,
  principalType principalType not null,
  principalID UUID not null,
  scopeType scopeType not null,
  scopeID UUID,
  actionID UUID not null,
  permissionLevel permissionLevel not null
);