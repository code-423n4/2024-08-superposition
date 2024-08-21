
# GraphQL Faucet interface

Listens for a mutation to request tokens, and sends the SPN token for Superposition
Testnet on demand. With a feature flag optionally supports gating the amount of tokens
send to a list of users. Batches the sends using the contract within a 5 second window
(with some extra seconds added randomly.)

## Features

|         Name          |                      Description                       |
|-----------------------|--------------------------------------------------------|
| `faucet stakers only` | Sends only to the list of stakers in the stakers file. |
