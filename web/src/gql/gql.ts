/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n  fragment AllPoolsFragment on SeawaterPool {\n    address\n    token {\n      name\n      decimals\n    }\n    volumeOverTime {\n      daily {\n        fusdc {\n          valueScaled\n        }\n      }\n    }\n    tvlOverTime {\n      daily\n    }\n    liquidityOverTime {\n      daily {\n        fusdc {\n          valueScaled\n        }\n      }\n    }\n    positions {\n      positions {\n        lower\n        upper\n      }\n    }\n  }\n": types.AllPoolsFragmentFragmentDoc,
    "\n  fragment SelectPrimeAssetFragment on SeawaterPool {\n    address\n    volumeOverTime {\n      daily {\n        fusdc {\n          valueUsd\n        }\n      }\n    }\n    token {\n      name\n      symbol\n      address\n      decimals\n    }\n  }\n": types.SelectPrimeAssetFragmentFragmentDoc,
    "\n  fragment ManagePoolFragment on SeawaterPool {\n    address\n    id\n    liquidity {\n      liquidity\n    }\n    token {\n      symbol\n      name\n      decimals\n    }\n    earnedFeesAPRFUSDC\n  }\n": types.ManagePoolFragmentFragmentDoc,
    "\n  fragment WithdrawPositionsFragment on Wallet {\n    positions {\n      positions {\n        positionId\n        lower\n        upper\n        owner {\n          address\n        }\n        liquidity {\n          fusdc {\n            valueUsd\n            valueScaled\n          }\n          token1 {\n            valueUsd\n            valueScaled\n          }\n        }\n      }\n    }\n  }\n": types.WithdrawPositionsFragmentFragmentDoc,
    "\n  fragment SwapExploreFragment on SeawaterPool {\n    token {\n      name\n      symbol\n      address\n      decimals\n    }\n    price\n  }\n": types.SwapExploreFragmentFragmentDoc,
    "\n  fragment MyPositionsInventoryWalletFragment on Wallet {\n    id\n    positions {\n      positions {\n        id\n        pool {\n          token {\n            name\n            address\n            symbol\n          }\n        }\n      }\n    }\n  }\n": types.MyPositionsInventoryWalletFragmentFragmentDoc,
    "\n  fragment TradeTabTransactionsFragment on SeawaterSwap {\n    timestamp\n    amountIn {\n      token {\n        symbol\n      }\n      valueScaled\n    }\n    amountOut {\n      token {\n        symbol\n      }\n      valueScaled\n    }\n  }\n": types.TradeTabTransactionsFragmentFragmentDoc,
    "\n  fragment StakeFormFragment on SeawaterPool {\n    address\n    earnedFeesAPRFUSDC\n    fee\n    config {\n      classification\n    }\n    priceOverTime {\n      daily\n    }\n    liquidity {\n      tickLower\n      tickUpper\n      price\n      liquidity\n    }\n  }\n": types.StakeFormFragmentFragmentDoc,
    "\n  fragment DepositPositionsFragment on Wallet {\n    positions {\n      positions {\n        positionId\n        lower\n        upper\n      }\n    }\n  }\n": types.DepositPositionsFragmentFragmentDoc,
    "\n  fragment SwapFormFragment on SeawaterPool {\n    address\n    fee\n    earnedFeesAPRFUSDC\n    earnedFeesAPRToken1\n    token {\n      address\n      decimals\n      name\n      symbol\n    }\n  }\n": types.SwapFormFragmentFragmentDoc,
    "\n  fragment SwapProPoolFragment on SeawaterPool {\n    address\n    token {\n      address\n      symbol\n    }\n    liquidity {\n      liquidity\n    }\n    priceOverTime {\n      daily\n      monthly\n    }\n    volumeOverTime {\n      monthly {\n        token1 {\n          timestamp\n          valueUsd\n        }\n        fusdc {\n          timestamp\n          valueUsd\n        }\n      }\n      daily {\n        token1 {\n          timestamp\n          valueUsd\n        }\n        fusdc {\n          timestamp\n          valueUsd\n        }\n      }\n    }\n    liquidityOverTime {\n      daily {\n        timestamp\n        fusdc {\n          valueUsd\n        }\n      }\n      monthly {\n        timestamp\n        fusdc {\n          valueUsd\n        }\n      }\n    }\n    swaps {\n      swaps {\n        transactionHash\n        timestamp\n        amountIn {\n          valueScaled\n          token {\n            symbol\n          }\n        }\n        amountOut {\n          valueScaled\n          token {\n            symbol\n          }\n        }\n      }\n    }\n  }\n": types.SwapProPoolFragmentFragmentDoc,
    "\n  query AllData {\n    pools {\n      # used for the pool selector\n      address\n\n      # add general fragments here\n      ...SwapProPoolFragment\n      ...AllPoolsFragment\n      ...SelectPrimeAssetFragment\n      ...SwapExploreFragment\n      ...ManagePoolFragment\n      ...SwapFormFragment\n      ...StakeFormFragment\n    }\n  }\n": types.AllDataDocument,
    "\n  query ForUser($wallet: String!) {\n    getSwapsForUser(wallet: $wallet, first: 10) {\n      data {\n        swaps {\n          # add transaction fragments here\n          ...TradeTabTransactionsFragment\n        }\n      }\n    }\n\n    getWallet(address: $wallet) {\n      # add wallet fragments here\n      ...MyPositionsInventoryWalletFragment\n      ...PositionsFragment\n      ...WithdrawPositionsFragment\n      ...DepositPositionsFragment\n    }\n  }\n": types.ForUserDocument,
    "\n  fragment PositionsFragment on Wallet {\n    id\n    positions {\n      positions {\n        created\n        served {\n          timestamp\n        }\n        positionId\n        pool {\n          token {\n            name\n            address\n            symbol\n            decimals\n          }\n        }\n        lower\n        upper\n        liquidity {\n          fusdc {\n            valueUsd\n          }\n          token1 {\n            valueUsd\n          }\n        }\n      }\n    }\n  }\n": types.PositionsFragmentFragmentDoc,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AllPoolsFragment on SeawaterPool {\n    address\n    token {\n      name\n      decimals\n    }\n    volumeOverTime {\n      daily {\n        fusdc {\n          valueScaled\n        }\n      }\n    }\n    tvlOverTime {\n      daily\n    }\n    liquidityOverTime {\n      daily {\n        fusdc {\n          valueScaled\n        }\n      }\n    }\n    positions {\n      positions {\n        lower\n        upper\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment AllPoolsFragment on SeawaterPool {\n    address\n    token {\n      name\n      decimals\n    }\n    volumeOverTime {\n      daily {\n        fusdc {\n          valueScaled\n        }\n      }\n    }\n    tvlOverTime {\n      daily\n    }\n    liquidityOverTime {\n      daily {\n        fusdc {\n          valueScaled\n        }\n      }\n    }\n    positions {\n      positions {\n        lower\n        upper\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment SelectPrimeAssetFragment on SeawaterPool {\n    address\n    volumeOverTime {\n      daily {\n        fusdc {\n          valueUsd\n        }\n      }\n    }\n    token {\n      name\n      symbol\n      address\n      decimals\n    }\n  }\n"): (typeof documents)["\n  fragment SelectPrimeAssetFragment on SeawaterPool {\n    address\n    volumeOverTime {\n      daily {\n        fusdc {\n          valueUsd\n        }\n      }\n    }\n    token {\n      name\n      symbol\n      address\n      decimals\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ManagePoolFragment on SeawaterPool {\n    address\n    id\n    liquidity {\n      liquidity\n    }\n    token {\n      symbol\n      name\n      decimals\n    }\n    earnedFeesAPRFUSDC\n  }\n"): (typeof documents)["\n  fragment ManagePoolFragment on SeawaterPool {\n    address\n    id\n    liquidity {\n      liquidity\n    }\n    token {\n      symbol\n      name\n      decimals\n    }\n    earnedFeesAPRFUSDC\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment WithdrawPositionsFragment on Wallet {\n    positions {\n      positions {\n        positionId\n        lower\n        upper\n        owner {\n          address\n        }\n        liquidity {\n          fusdc {\n            valueUsd\n            valueScaled\n          }\n          token1 {\n            valueUsd\n            valueScaled\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment WithdrawPositionsFragment on Wallet {\n    positions {\n      positions {\n        positionId\n        lower\n        upper\n        owner {\n          address\n        }\n        liquidity {\n          fusdc {\n            valueUsd\n            valueScaled\n          }\n          token1 {\n            valueUsd\n            valueScaled\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment SwapExploreFragment on SeawaterPool {\n    token {\n      name\n      symbol\n      address\n      decimals\n    }\n    price\n  }\n"): (typeof documents)["\n  fragment SwapExploreFragment on SeawaterPool {\n    token {\n      name\n      symbol\n      address\n      decimals\n    }\n    price\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment MyPositionsInventoryWalletFragment on Wallet {\n    id\n    positions {\n      positions {\n        id\n        pool {\n          token {\n            name\n            address\n            symbol\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment MyPositionsInventoryWalletFragment on Wallet {\n    id\n    positions {\n      positions {\n        id\n        pool {\n          token {\n            name\n            address\n            symbol\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TradeTabTransactionsFragment on SeawaterSwap {\n    timestamp\n    amountIn {\n      token {\n        symbol\n      }\n      valueScaled\n    }\n    amountOut {\n      token {\n        symbol\n      }\n      valueScaled\n    }\n  }\n"): (typeof documents)["\n  fragment TradeTabTransactionsFragment on SeawaterSwap {\n    timestamp\n    amountIn {\n      token {\n        symbol\n      }\n      valueScaled\n    }\n    amountOut {\n      token {\n        symbol\n      }\n      valueScaled\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment StakeFormFragment on SeawaterPool {\n    address\n    earnedFeesAPRFUSDC\n    fee\n    config {\n      classification\n    }\n    priceOverTime {\n      daily\n    }\n    liquidity {\n      tickLower\n      tickUpper\n      price\n      liquidity\n    }\n  }\n"): (typeof documents)["\n  fragment StakeFormFragment on SeawaterPool {\n    address\n    earnedFeesAPRFUSDC\n    fee\n    config {\n      classification\n    }\n    priceOverTime {\n      daily\n    }\n    liquidity {\n      tickLower\n      tickUpper\n      price\n      liquidity\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment DepositPositionsFragment on Wallet {\n    positions {\n      positions {\n        positionId\n        lower\n        upper\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment DepositPositionsFragment on Wallet {\n    positions {\n      positions {\n        positionId\n        lower\n        upper\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment SwapFormFragment on SeawaterPool {\n    address\n    fee\n    earnedFeesAPRFUSDC\n    earnedFeesAPRToken1\n    token {\n      address\n      decimals\n      name\n      symbol\n    }\n  }\n"): (typeof documents)["\n  fragment SwapFormFragment on SeawaterPool {\n    address\n    fee\n    earnedFeesAPRFUSDC\n    earnedFeesAPRToken1\n    token {\n      address\n      decimals\n      name\n      symbol\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment SwapProPoolFragment on SeawaterPool {\n    address\n    token {\n      address\n      symbol\n    }\n    liquidity {\n      liquidity\n    }\n    priceOverTime {\n      daily\n      monthly\n    }\n    volumeOverTime {\n      monthly {\n        token1 {\n          timestamp\n          valueUsd\n        }\n        fusdc {\n          timestamp\n          valueUsd\n        }\n      }\n      daily {\n        token1 {\n          timestamp\n          valueUsd\n        }\n        fusdc {\n          timestamp\n          valueUsd\n        }\n      }\n    }\n    liquidityOverTime {\n      daily {\n        timestamp\n        fusdc {\n          valueUsd\n        }\n      }\n      monthly {\n        timestamp\n        fusdc {\n          valueUsd\n        }\n      }\n    }\n    swaps {\n      swaps {\n        transactionHash\n        timestamp\n        amountIn {\n          valueScaled\n          token {\n            symbol\n          }\n        }\n        amountOut {\n          valueScaled\n          token {\n            symbol\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment SwapProPoolFragment on SeawaterPool {\n    address\n    token {\n      address\n      symbol\n    }\n    liquidity {\n      liquidity\n    }\n    priceOverTime {\n      daily\n      monthly\n    }\n    volumeOverTime {\n      monthly {\n        token1 {\n          timestamp\n          valueUsd\n        }\n        fusdc {\n          timestamp\n          valueUsd\n        }\n      }\n      daily {\n        token1 {\n          timestamp\n          valueUsd\n        }\n        fusdc {\n          timestamp\n          valueUsd\n        }\n      }\n    }\n    liquidityOverTime {\n      daily {\n        timestamp\n        fusdc {\n          valueUsd\n        }\n      }\n      monthly {\n        timestamp\n        fusdc {\n          valueUsd\n        }\n      }\n    }\n    swaps {\n      swaps {\n        transactionHash\n        timestamp\n        amountIn {\n          valueScaled\n          token {\n            symbol\n          }\n        }\n        amountOut {\n          valueScaled\n          token {\n            symbol\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AllData {\n    pools {\n      # used for the pool selector\n      address\n\n      # add general fragments here\n      ...SwapProPoolFragment\n      ...AllPoolsFragment\n      ...SelectPrimeAssetFragment\n      ...SwapExploreFragment\n      ...ManagePoolFragment\n      ...SwapFormFragment\n      ...StakeFormFragment\n    }\n  }\n"): (typeof documents)["\n  query AllData {\n    pools {\n      # used for the pool selector\n      address\n\n      # add general fragments here\n      ...SwapProPoolFragment\n      ...AllPoolsFragment\n      ...SelectPrimeAssetFragment\n      ...SwapExploreFragment\n      ...ManagePoolFragment\n      ...SwapFormFragment\n      ...StakeFormFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ForUser($wallet: String!) {\n    getSwapsForUser(wallet: $wallet, first: 10) {\n      data {\n        swaps {\n          # add transaction fragments here\n          ...TradeTabTransactionsFragment\n        }\n      }\n    }\n\n    getWallet(address: $wallet) {\n      # add wallet fragments here\n      ...MyPositionsInventoryWalletFragment\n      ...PositionsFragment\n      ...WithdrawPositionsFragment\n      ...DepositPositionsFragment\n    }\n  }\n"): (typeof documents)["\n  query ForUser($wallet: String!) {\n    getSwapsForUser(wallet: $wallet, first: 10) {\n      data {\n        swaps {\n          # add transaction fragments here\n          ...TradeTabTransactionsFragment\n        }\n      }\n    }\n\n    getWallet(address: $wallet) {\n      # add wallet fragments here\n      ...MyPositionsInventoryWalletFragment\n      ...PositionsFragment\n      ...WithdrawPositionsFragment\n      ...DepositPositionsFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PositionsFragment on Wallet {\n    id\n    positions {\n      positions {\n        created\n        served {\n          timestamp\n        }\n        positionId\n        pool {\n          token {\n            name\n            address\n            symbol\n            decimals\n          }\n        }\n        lower\n        upper\n        liquidity {\n          fusdc {\n            valueUsd\n          }\n          token1 {\n            valueUsd\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment PositionsFragment on Wallet {\n    id\n    positions {\n      positions {\n        created\n        served {\n          timestamp\n        }\n        positionId\n        pool {\n          token {\n            name\n            address\n            symbol\n            decimals\n          }\n        }\n        lower\n        upper\n        liquidity {\n          fusdc {\n            valueUsd\n          }\n          token1 {\n            valueUsd\n          }\n        }\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;