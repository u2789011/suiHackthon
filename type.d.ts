//Type
type RpcNode = {
  name: string;
  url: string;
  latency: number;
};

type Network = "mainnet" | "testnet" | "devnet";

type TokenInfo = {
  token: COIN;
  symbol: string;
  iconPath: string;
  isLST?: boolean;
};

type BasicCoin = "SUI" | "USDC" | "USDT" | "BUCK";

/*
type TaskDescription = {
  description: string;
  format: number; // 0: Plaintext, 1: Markdown
  publish_time: number; // Unix timestamp in milliseconds
};

type Task = {
  reward_type: string;
  id: string;
  version: number;
  name: string;
  description: TaskDescription[];
  image_url: string;
  publish_date: number; // Unix timestamp in milliseconds
  creator: string; // address
  moderator: string; // address
  area: string;
  is_active: boolean; // true: active, false: inactive
  fund: number;
  reward_amount: number;
  task_sheets: any[]; // assuming task_sheets is an array of objects
  poc_img_url: string;
};
*/
