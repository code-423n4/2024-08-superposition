export const usdFormat = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value < 1000000 ? "standard" : "compact",
    minimumFractionDigits: 2,
  }).format(value);
};
