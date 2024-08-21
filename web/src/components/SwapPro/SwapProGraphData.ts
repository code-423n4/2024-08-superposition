import { subDays } from "date-fns";

export const getSwapProGraphMockData = (length: number) => {
  const data = [];
  for (let i = 0; i < length; i++) {
    data.push({
      date: subDays(new Date(), length - i),
      value: Math.floor(Math.random() * 1000),
    });
  }
  return data;
};
