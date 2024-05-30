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

type SuiObjectResponse = any;


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
  publish_date: string; // Unix timestamp in milliseconds
  creator: string; // address
  moderator: string; // address
  area: string;
  is_active: boolean; // true: active, false: inactive
  fund: string;
  reward_amount: number;
  task_sheets: any[]; // assuming task_sheets is an array of objects
  poc_img_url: string;
};

type TaskSheet = {
  data: {
    digest: string;
    fields: {
      id: any[];
      status: number;
      main_task_id: string;
      task_description: TaskDescription;
      content?: string | null;
      annotation?: string | null;
      moderator: string;
      creator: string;
      created_time: string;
      update_time: string;
    };
  };
}

type TaskAdminCap = {
  data: Array<{
    data: {
      content: {
        dataType: string;
        fields: {
          id: string[];
          hasPublicTransfer: boolean;
          type: string;
          digest: string;
          objectId: string;
          version: string;
        };
      };
    };
  }>;
  nextCursor: string;
  hasNextPage: boolean;
};
