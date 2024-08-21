
# Ethereum Ingestor

Ethereum ingestor simply reads data from the chain and stores it in the database for later
retrieval. It subscribes to block headers, and it allows dependent services to determine
if they need a log from the block header using the block header check function.

## Notes on finality

Does not make any assumptions about finality.
