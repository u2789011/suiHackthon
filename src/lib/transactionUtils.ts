import { toast } from "react-toastify";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";

export const checkWalletConnection = (account: any) => {
    if (!account) {
      toast.error("Please connect your wallet");
      return false;
    }
    return true;
  };
  
export const createTransactionBlock = (account: any, moveCallParams: any) => {
    const txb = new TransactionBlock();
    txb.moveCall(moveCallParams);
    txb.setSender(account.address);
    return txb;
};
  
export const executeTransaction = async (
    client: any,
    txb: TransactionBlock,
    onSuccess: (res: any) => Promise<void>,
    onError: (err: any) => void
    ) => {
    const dryrunRes = await client.dryRunTransactionBlock({
        transactionBlock: await txb.build({ client: client }),
    });

    if (dryrunRes.effects.status.status !== "success") {
        toast.error("Something went wrong");
        return;
    }
};
