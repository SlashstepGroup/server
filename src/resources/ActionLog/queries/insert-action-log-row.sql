
insert into action_logs (action_id, actor_id, actor_ip_address, delegate_id, target_ids, reason) values ($1, $2, $3, $4, $5, $6) returning *;