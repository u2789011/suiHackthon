import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import BasicDataField from "./fields/basicDataField";
import { useContext, useMemo } from "react";
import { COIN } from "bucket-protocol-sdk";
import { ConnectModal } from "@mysten/dapp-kit";
import ConnectMenu from "./ui/connectMenu";
import "@mysten/dapp-kit/dist/index.css";
import { AppContext } from "@/context/AppContext";
import { Link as LinkIcon } from "lucide-react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import "tailwindcss/tailwind.css";
// import SlideInMenu from "./slideInMenu";
// import RpcSetting from "./rpcSetting";

const Header = () => {
  const { walletAddress, suiName } = useContext(AppContext);
  const { data: suiBalance, refetch } = useSuiClientQuery("getBalance", {
    owner: walletAddress ?? "",
  });
  const userBalance = useMemo(() => {
    if (suiBalance?.totalBalance) {
      return Math.floor(Number(suiBalance?.totalBalance) / 10 ** 9);
    } else {
      return 0;
    }
  }, [suiBalance]);

  return (
    <div
      className="fixed top-0 left-0 w-full backdrop-blur-md z-50 font-sans"
      style={{
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <header className="w-full max-w-360 mx-auto h-20 flex items-center justify-between pt-4 pb-3 px-4 z-50">
        <Link href="/" passHref>
          <div className="flex items-center">
            <Image src="/FrenSuipport.svg" alt="Logo" width={50} height={50} />
            <Image
              src="/Frensuipportfont.svg"
              alt="Logo"
              width={280}
              height={50}
            />
          </div>
        </Link>
        <div className="flex-grow"></div>
        <div className="flex items-center gap-4 ml-auto">
          <BasicDataField
            label="Sui Balance"
            value={userBalance ?? "0.0000"}
            spaceWithUnit
            unit="SUI"
            minFractionDigits={0}
          />
          {walletAddress ? (
            <ConnectMenu walletAddress={walletAddress} suiName={suiName} />
          ) : (
            <ConnectModal
              trigger={
                <button
                  className="h-full rounded-[11px] outline-none ring-0 xl:button-animate-105 overflow-hidden p-[1px]"
                  disabled={!!walletAddress}
                >
                  <div className="h-full px-5 py-4 flex items-center gap-2 rounded-xl bg-white/10">
                    <span className="text-sm">
                      {walletAddress ? "Connected" : "Connect Wallet"}
                    </span>
                    <LinkIcon size={17} className="text-black" />
                  </div>
                </button>
              }
            />
          )}
        </div>
      </header>
    </div>
  );
};

export default Header;
