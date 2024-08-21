// list contains the list of features currently supported in the Go codebase.

package features

const (
	// FeatureGraphqlMockGraph by sending mocked data instead of database data.
	FeatureGraphqlMockGraph = "graphql mock demo data"

	// FeatureGraphqlMockGraphDelay by delaying the display of the mocked data.
	FeatureGraphqlMockGraphDataDelay = "graphql mock demo data delay"

	// FeatureIngestorPollRpc using the ingestor. Useful in environments
	// where websocket access is inconsistent or unavailable. Does so with
	// a (by default) 15 second delay, with checkpointing done in the database.
	FeatureIngestorPollRpc = "ingestor poll rpc"

	// FeatureFaucetStakersOnly to gate access to the faucet to
	// through the moderators graph.
	FeatureFaucetStakersOnly = "faucet stakers only"

	// FeatureFaucetEnabled is allowed to be used.
	FeatureFaucetEnabled = "faucet enabled"
)
