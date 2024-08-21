
# Cmdlets

Cmdlets contain executables that either:

1. Respond to messages to be included in a graph request
2. Pick up messages using Kafka and then insert them into the database

## The "func" pattern

Each cmdlet includes a file named "func.go" that stores the entrypoint for the code. The
state is included there as an argument for simple testing. The function inside is named
"Entry". The main file should set up the state.
