
# Snapshot Ethereum

Snapshots every position tracked as a database event every 5 minutes (and up to 15 random
seconds) by retrieving the position's tick range, and the position's delta. Writes each
response to the database.

Also snapshots liquidity groups to the new table.

## Note

It's wise to protect this from running without any protection in the form of a lock. At a
infra level we orchestrate this with a lockfile to prevent it from doubling up with our
scheduling.
