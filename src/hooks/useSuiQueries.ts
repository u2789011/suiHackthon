import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { useSuiClientQuery } from "@mysten/dapp-kit";

const PACKAGE_ID = "0xf4fb9b3ec99244bd263463817ea07b8d81a9e3edbbe9e09c7a335c566396aa3a";

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

    // Get All ModCaps from Uder Wallet
    const { data: userModCaps, refetch: refetchUserModCaps } = useSuiClientQuery('getOwnedObjects', {
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
        userModCaps,
        refetchUserModCaps
    };
};