import { subDays } from "date-fns";

export const getMockYieldOverTimeData = (length: number) => {
  const data = [];
  for (let i = 0; i < length; i++) {
    data.push({
      date: subDays(new Date(), length - i),
      uv: Math.floor(Math.random() * 1000),
      pv: Math.floor(Math.random() * 1000),
    });
  }
  return data;
};
