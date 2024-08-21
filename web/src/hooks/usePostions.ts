import { Token } from "@/config/tokens";
import { graphql, useFragment } from "@/gql";
import { useGraphqlUser } from "@/hooks/useGraphql";
import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Position partially defines the remote Position type with necessary fields
export type Position = {
  // the age at which the position was created
  created: number;
  // the age at which the request was created and cached
  served: {
    timestamp: number;
  };
  positionId: number;
  pool: {
    token: Token;
  };
  lower: number;
  upper: number;
  liquidity: {
    fusdc: {
      valueUsd: string;
    };
    token1: {
      valueUsd: string;
    };
  };
};

interface PositionStore {
  // positionsLocal is a list of positions modified by local actions
  positionsLocal: { [positionId: number]: Position };
  // positions is a key value store of the most up to date positions
  // from the remote server and local
  positions: { [positionId: number]: Position };
  // receive new positions, preferring the newest version of each position
  updatePositionsFromGraph: (newPositions: Array<Position>) => void;
  // store a local position update after depositing or withdrawing a stake
  // it is assumed this is always newer/more accurate than the remote data
  // the first time it is stored
  updatePositionLocal: (newPosition: Position) => void;
}

const usePositionStore = create<PositionStore>()(
  persist(
    (set) => {
      return {
        positions: [],
        positionsLocal: {},
        updatePositionsFromGraph: (newPositions) =>
          set(({ positionsLocal }) => {
            const positionsUpdated = newPositions.map((newPosition) => {
              const local = positionsLocal[newPosition.positionId];
              if (local?.served.timestamp < newPosition.served.timestamp)
                return local;
              return newPosition;
            });
            return {
              positionsLocal,
              positions: positionsUpdated,
            };
          }),
        updatePositionLocal: (newPosition) =>
          set(({ positionsLocal, positions }) => ({
            positionsLocal: {
              ...positionsLocal,
              [newPosition.positionId]: newPosition,
            },
            positions: {
              ...positions,
              [newPosition.positionId]: newPosition,
            },
          })),
      };
    },
    {
      name: "position-store",
    },
  ),
);

const PositionsFragment = graphql(`
  fragment PositionsFragment on Wallet {
    id
    positions {
      positions {
        created
        served {
          timestamp
        }
        positionId
        pool {
          token {
            name
            address
            symbol
            decimals
          }
        }
        lower
        upper
        liquidity {
          fusdc {
            valueUsd
          }
          token1 {
            valueUsd
          }
        }
      }
    }
  }
`);

export const usePositions = () => {
  const { data: userData } = useGraphqlUser();
  const positionsData = useFragment(PositionsFragment, userData?.getWallet);
  const { positions, updatePositionLocal, updatePositionsFromGraph } =
    usePositionStore();

  useEffect(() => {
    if (!positionsData) return;
    updatePositionsFromGraph(
      // postprocess this to assert that the nested address type is correct
      positionsData.positions.positions.map((p) => ({
        ...p,
        pool: {
          ...p.pool,
          token: {
            ...p.pool.token,
            address: p.pool.token.address as `0x${string}`,
          },
        },
      })),
    );
  }, [positionsData]);

  return {
    positions: Object.values(positions),
    updatePositionLocal,
  };
};
