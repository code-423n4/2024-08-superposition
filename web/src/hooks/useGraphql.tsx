import { useQuery } from "@tanstack/react-query";
import request from "graphql-request";
import { graphqlEndpoint } from "@/config/graphqlEndpoint";
import { graphql } from "@/gql";
import { useAccount } from "wagmi";

/**
 * The main GraphQL query to fetch all data. The global query that should be run and
 * refreshed. This should include any high cost pool-specific requests where possible,
 * since behind the scenes this should be reloaded and cached with swr without downtime.
 *
 * Fragments are used to fetch only the data we need. They are configured in the
 * components that use the data.
 */
export const graphqlQueryGlobal = graphql(`
  query AllData {
    pools {
      # used for the pool selector
      address

      # add general fragments here
      ...SwapProPoolFragment
      ...AllPoolsFragment
      ...SelectPrimeAssetFragment
      ...SwapExploreFragment
      ...ManagePoolFragment
      ...SwapFormFragment
      ...StakeFormFragment
    }
  }
`);

/**
 * The user-specific GraphQL query that's hard to cache. Done on a per-user basis, and
 * loaded once the user connects their wallet.
 */
export const graphqlQueryUser = graphql(`
  query ForUser($wallet: String!) {
    getSwapsForUser(wallet: $wallet, first: 10) {
      data {
        swaps {
          # add transaction fragments here
          ...TradeTabTransactionsFragment
        }
      }
    }

    getWallet(address: $wallet) {
      # add wallet fragments here
      ...MyPositionsInventoryWalletFragment
      ...PositionsFragment
      ...WithdrawPositionsFragment
      ...DepositPositionsFragment
    }
  }
`);
/**
 * Fetch all data from the global GraphQL endpoint.
 */
export const useGraphqlGlobal = () => {
  if (!graphqlEndpoint)
    throw new Error("NEXT_PUBLIC_LONGTAIL_GRAPHQL_URL not set!");

  return useQuery({
    queryKey: ["graphql"],
    queryFn: () => request(graphqlEndpoint!, graphqlQueryGlobal),
    refetchInterval: 60 * 1000, // 1 minute
  });
};

export const useGraphqlUser = () => {
  if (!graphqlEndpoint)
    throw new Error("NEXT_PUBLIC_LONGTAIL_GRAPHQL_URL not set!");

  const { address } = useAccount();

  // TODO needs to be replaced with an empty instance of this

  return useQuery({
    queryKey: ["graphql", address ?? ""],
    queryFn: () =>
      request(graphqlEndpoint!, graphqlQueryUser, { wallet: address ?? "" }),
    refetchInterval: 20 * 1000, // 20 seconds
    enabled: !!address,
  });
};
