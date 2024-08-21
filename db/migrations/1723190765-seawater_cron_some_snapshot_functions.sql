-- migrate:up

SELECT cron.schedule('update daily ticks', '0 * * * *', 'snapshot_final_ticks_daily_1()');

SELECT cron.schedule('update monthly ticks', '0 * * * *', 'snapshot_final_ticks_monthly_2()');

SELECT cron.schedule('update liquidity grouping', '*/30 * * * *', 'snapshot_liquidity_groups_1()');

SELECT cron.schedule('update latest ticks', '*/30 * * * *', 'snapshot_latest_ticks_1()');

-- migrate:down
