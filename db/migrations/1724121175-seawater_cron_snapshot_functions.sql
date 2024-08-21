-- migrate:up

SELECT cron.unschedule('update daily ticks');
SELECT cron.unschedule('update monthly ticks');

SELECT cron.schedule('update daily ticks', '0 * * * *', 'snapshot_final_ticks_daily_2()');

SELECT cron.schedule('update monthly ticks', '0 * * * *', 'snapshot_final_ticks_monthly_3()');

-- migrate:down
