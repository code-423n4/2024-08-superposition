import { useMediaQuery as useRrMediaQuery } from "react-responsive";

export const useMediaQuery = () => {
  const isLtSm = useRrMediaQuery({
    query: "(max-width: 640px)",
  });

  const isSm = useRrMediaQuery({
    query: "(min-width: 640px)",
  });

  const isMd = useRrMediaQuery({
    query: "(min-width: 768px)",
  });

  return {
    isSm,
    isLtSm,
    isMd,
  };
};
