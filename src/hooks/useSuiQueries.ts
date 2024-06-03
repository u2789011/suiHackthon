import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { useSuiClientQuery } from "@mysten/dapp-kit";

const PACKAGE_ID = "0xd84bf8f814a797c2e04a31dba8d4ba276489dc835e6b3ee725059a756b0cfe14";

export const useSuiQueries = () => {

    // Get User Wallet and Sui Name
    const { walletAddress, suiName } = useContext(AppContext);

    // Get User Balance
    const { data: suiBalance, refetch } = useSuiClientQuery('getBalance', {
        owner: walletAddress ?? '',
    });

    // Get All Coins From User Wallet
    const { data: allCoins } = useSuiClientQuery('getAllCoins', {
        owner: walletAddress ?? '',
    });

    // Get All Task Sheets from User Wallet
    const { data: userTaskSheets, refetch: refetchUserTaskSheets } = useSuiClientQuery('getOwnedObjects', {
        owner: walletAddress ?? '',
        filter: {
            StructType: `${PACKAGE_ID}::public_task::TaskSheet`,
        },
        options: {
            showType: true,
            showContent: true,
            showPreviousTransaction: true,
        },
    });

    // Get All TaskAdminCaps from User Wallet
    const { data: userTaskAdminCaps } = useSuiClientQuery('getOwnedObjects', {
        owner: walletAddress ?? '',
        filter: {
            StructType: `${PACKAGE_ID}::public_task::TaskAdminCap`,
        },
        options: {
            showType: true,
            showContent: true,
            showPreviousTransaction: true,
        },
    });

    // Get All ModCaps from Uder Wallet
    const { data: userModCaps } = useSuiClientQuery('getOwnedObjects', {
        owner: walletAddress ?? '',
        filter: {
            StructType: `${PACKAGE_ID}::public_task::ModCap`,
        },
        options:{
            showType: true,
            showContent: true,
            showPreviousTransaction: true,
        },
    });

    return {
        suiBalance,
        refetch,
        allCoins,
        userTaskSheets,
        refetchUserTaskSheets,
        userTaskAdminCaps,
        userModCaps,
    };
};