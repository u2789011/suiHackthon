import * as React from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

const Stashdrop: React.FC = () => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <a href="https://stashdrop.org/?ref=ezjUZSTx2W" target="_blank" rel="noopener noreferrer">
                        <img src="/StashdropLogo.svg" alt="Stashdrop" style={{width: '100px', height:'40px'}}/>
                    </a>
                </TooltipTrigger>
                <TooltipContent className="border border-white/50 rounded">
                    Need Some Initial Gas Boost? Get Airdrop by STASHDROP
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default Stashdrop;