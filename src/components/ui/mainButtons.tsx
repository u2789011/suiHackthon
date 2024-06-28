import React from 'react';
import { Button, Link } from "@nextui-org/react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

interface PublishTaskButtonProps {
    publicTaskGrant: boolean;
    onOpenModal1: () => void;
    setSelectedTask: (task: any) => void;
}

// FIXME: Tooltip Content to add a funcitonal button to trigger mint
const PublishTaskButton: React.FC<PublishTaskButtonProps> = ({ publicTaskGrant, onOpenModal1, setSelectedTask }) => {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                onClick={() => {
                  setSelectedTask(null);
                  onOpenModal1();
                }}
                size="lg"
                className={"font-serif uppercase"}
                color="secondary"
                isDisabled={!publicTaskGrant}
              >
                Publish Task
              </Button>
            </span>
          </TooltipTrigger>
          {!publicTaskGrant && (
            <TooltipContent>
              You need a Suifren holding one of the mystical Port Temple relics to publish tasks.
              Pick one for your journey: 
              <Link 
                href="https://suifrens-testnet-az1ho1jq2-mysten-labs.vercel.app/accessory/magic-wand"
                isExternal
                className="font-sans"
              >
              &nbsp;Poseidon&apos;s Trident
              </Link>
              &nbsp;| Dragon King&apos;s Pearl
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  export default PublishTaskButton;