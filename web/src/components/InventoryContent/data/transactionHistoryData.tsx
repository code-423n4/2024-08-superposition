import { TransactionHistory } from "@/app/_TransactionHistoryTable/columns";
import { nanoid } from "nanoid";
import Token from "@/assets/icons/token.svg";
import Ethereum from "@/assets/icons/ethereum.svg";
import { subDays, subHours, subMinutes, subWeeks } from "date-fns";

export const transactionHistoryData: TransactionHistory[] = [
  {
    id: nanoid(),
    tokens: [
      {
        name: "fUSDC",
        icon: <Token />,
      },
      {
        name: "ETH",
        icon: <Ethereum className={"invert"} />,
      },
    ],
    date: subMinutes(new Date(), 1),
    rewards: 2.01,
  },
  {
    id: nanoid(),
    tokens: [
      {
        name: "ETH",
        icon: <Ethereum className={"invert"} />,
      },
      {
        name: "fUSDC",
        icon: <Token />,
      },
    ],
    date: subHours(new Date(), 1),
    rewards: 12.33,
  },
  {
    id: nanoid(),
    tokens: [
      {
        name: "fUSDC",
        icon: <Token />,
      },
      {
        name: "ETH",
        icon: <Ethereum className={"invert"} />,
      },
    ],
    date: subDays(new Date(), 1),
    rewards: 12.33,
  },
  {
    id: nanoid(),
    tokens: [
      {
        name: "ETH",
        icon: <Ethereum className={"invert"} />,
      },
      {
        name: "fUSDC",
        icon: <Token />,
      },
    ],
    date: subWeeks(new Date(), 1),
    rewards: 12.33,
  },
  {
    id: nanoid(),
    tokens: [
      {
        name: "fUSDC",
        icon: <Token />,
      },
      {
        name: "ETH",
        icon: <Ethereum className={"invert"} />,
      },
    ],
    date: subWeeks(new Date(), 1),
    rewards: 12.33,
  },
  {
    id: nanoid(),
    tokens: [
      {
        name: "fUSDC",
        icon: <Token />,
      },
      {
        name: "ETH",
        icon: <Ethereum className={"invert"} />,
      },
    ],
    date: subWeeks(new Date(), 1),
    rewards: 12.33,
  },
  {
    id: nanoid(),
    tokens: [
      {
        name: "fUSDC",
        icon: <Token />,
      },
      {
        name: "ETH",
        icon: <Ethereum className={"invert"} />,
      },
    ],
    date: subWeeks(new Date(), 1),
    rewards: 12.33,
  },
  {
    id: nanoid(),
    tokens: [
      {
        name: "fUSDC",
        icon: <Token />,
      },
      {
        name: "ETH",
        icon: <Ethereum className={"invert"} />,
      },
    ],
    date: subWeeks(new Date(), 1),
    rewards: 12.33,
  },
  {
    id: nanoid(),
    tokens: [
      {
        name: "fUSDC",
        icon: <Token />,
      },
      {
        name: "ETH",
        icon: <Ethereum className={"invert"} />,
      },
    ],
    date: subWeeks(new Date(), 1),
    rewards: 12.33,
  },
  {
    id: nanoid(),
    tokens: [
      {
        name: "fUSDC",
        icon: <Token />,
      },
      {
        name: "ETH",
        icon: <Ethereum className={"invert"} />,
      },
    ],
    date: subWeeks(new Date(), 1),
    rewards: 12.33,
  },
  {
    id: nanoid(),
    tokens: [
      {
        name: "fUSDC",
        icon: <Token />,
      },
      {
        name: "ETH",
        icon: <Ethereum className={"invert"} />,
      },
    ],
    date: subWeeks(new Date(), 1),
    rewards: 12.33,
  },
  {
    id: nanoid(),
    tokens: [
      {
        name: "fUSDC",
        icon: <Token />,
      },
      {
        name: "ETH",
        icon: <Ethereum className={"invert"} />,
      },
    ],
    date: subWeeks(new Date(), 1),
    rewards: 12.33,
  },
];
