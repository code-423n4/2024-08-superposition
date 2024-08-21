"use client";
//

import { useEffect } from "react";
import { queryClient } from "@/context";
import { AllDataQuery } from "@/gql/graphql";

/**
 * This component is used to populate the query cache with the data fetched from the server.
 * To use this fetch the data from the server in a server component and pass it to this component.
 */
export default function PopulateQueryCache({
  data,
  featuresData,
}: {
  data: AllDataQuery;
  featuresData: any;
}) {
  useEffect(() => {
    // using the same query key as in useGraphql.tsx
    queryClient.setQueryData(["graphql", ""], data);
  }, [data]);

  useEffect(() => {
    // using the same query key as in useFeatureFlag.tsx
    queryClient.setQueryData(["featureFlags"], featuresData);
  }, [featuresData]);

  return null;
}
