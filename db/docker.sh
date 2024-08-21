#!/bin/sh

docker build -t superposition/database .

# Usually pg_cron config settings would be in postgresql.conf
# but changing them in an init script doesn't seem to be respected
docker run \
	-e POSTGRES_USER=${POSTGRES_USER:-superposition} \
	-e POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-superposition} \
	-p 5432:5432 \
	-t superposition/database \
	-c cron.database_name=${POSTGRES_DB:-superposition} \
	-c shared_preload_libraries=timescaledb,pg_cron \
	-c log_statement=all
