-- migrate:up

-- these functions were previously run without SELECT, causing them to fail unconditionally
SELECT cron.unschedule('update daily ticks');
SELECT cron.unschedule('update monthly ticks');
SELECT cron.unschedule('update liquidity grouping');
SELECT cron.unschedule('update latest ticks');

SELECT cron.schedule('update daily ticks', '0 * * * *', 'SELECT snapshot_final_ticks_daily_3()');

SELECT cron.schedule('update monthly ticks', '0 * * * *', 'SELECT snapshot_final_ticks_monthly_3()');

SELECT cron.schedule('update liquidity grouping', '*/30 * * * *', 'SELECT snapshot_liquidity_groups_1()');
SELECT cron.schedule('update latest ticks', '*/30 * * * *', 'SELECT snapshot_latest_ticks_1()');

-- migrate:down
