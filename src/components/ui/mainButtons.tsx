import React from 'react';
import {Button} from "@nextui-org/react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

interface PublishTaskButtonProps {
    publicTaskGrant: boolean;
    onOpenModal1: () => void;
    setSelectedTask: (task: any) => void;
}

// FIXME: 
const PublishTaskButton: React.FC<PublishTaskButtonProps> = ({ publicTaskGrant, onOpenModal1, setSelectedTask }) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                onClick={() => {
                  setSelectedTask(null);
                  onOpenModal1();
                }}
                size="lg"
                className={`font-serif uppercase`}
                color="secondary"
                isDisabled={!publicTaskGrant}
              >
                Publish Task
              </Button>
            </span>
          </TooltipTrigger>
          {!publicTaskGrant && (
            <TooltipContent>
              You need the appropriate accessory to publish tasks
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  export default PublishTaskButton;