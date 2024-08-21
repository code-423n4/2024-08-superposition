
FROM timescale/timescaledb:2.15.0-pg15

WORKDIR /usr/local/src/superposition/database

RUN apk add make curl

RUN apk add postgresql-pg_cron \
	&& ls /usr/lib | grep postgres \
    && cp /usr/lib/postgresql15/pg_cron.so /usr/local/lib/postgresql/ \
	&& ls /usr/share/postgresql/extension \
    && cp /usr/share/postgresql/extension/* /usr/local/share/postgresql/extension

RUN curl -fsSLo \
	/usr/local/bin/dbmate \
	https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64

RUN chmod +x /usr/local/bin/dbmate

COPY migrations/ .

COPY init-database.sh /docker-entrypoint-initdb.d/init-sqls.sh
