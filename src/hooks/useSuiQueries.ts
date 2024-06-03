import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { useSuiClientQuery } from "@mysten/dapp-kit";

const PACKAGE_ID = "0xecf2634415b80825ed7c8eb0665d72634a724c20fdfecc2829d342cc919a4bc3";

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
    const { data: userTaskAdminCaps, refetch: refetchUse } = useSuiClientQuery('getOwnedObjects', {
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