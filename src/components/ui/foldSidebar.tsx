import React, { useState } from "react";
import {
  Avatar,
  Accordion,
  AccordionItem,
  Image,
  Link,
  Button,
} from "@nextui-org/react";

interface SuifrenCard2Props {
  suiFrenSvg: string | null;
  isError: boolean;
}

const FoldableSideBar: React.FC<SuifrenCard2Props> = ({ suiFrenSvg, isError }) => {
  const [isOpen, setIsOpen] = useState(true);
  const defaultSvgPath = "/frens/voidfren.svg";

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 transform -translate-y-1/2 bg-orange-500 bg-opacity-90 text-black text-center px-2 py-1 rounded-r-xl border-3 border-black transition-transform duration-360 ease-in-out font-bold ${
          isOpen ? 'left-[17rem]' : 'left-0'
        }`}
        style={{ zIndex: 1001 }}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? 'X' : '>'}
      </button>
      <div
        className={`fixed left-0 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-360 ease-in-out w-72 backdrop-blur-lg text-white p-4 shadow-lg rounded-r-2xl`}
        style={{ maxHeight: '90vh', top: '50%', transform: `translateY(-50%) ${isOpen ? 'translateX(0)' : 'translateX(-100%)'}`, zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.5)', willChange: 'transform', backfaceVisibility: 'hidden' }}
      >
        <div className="sui-fren-container overflow-auto w-full">
          {isError ? (
            <div className="w-full flex flex-col items-center">
              <Avatar
                src={defaultSvgPath}
                alt="Void Fren"
                size="lg"
                className="mb-4 rounded-full w-32 h-32"
              />
              <h3 className="font-sans text-center">No SuiFren Yet</h3>
              <Button size="sm" className="mt-4">
                <Link
                  href="https://suifrens-testnet-az1ho1jq2-mysten-labs.vercel.app/mint"
                  isExternal
                  showAnchorIcon
                  className="font-sans"
                >
                  Go Get A SuiFren
                </Link>
              </Button>
            </div>
          ) : (
            <div className="w-full">
              <Accordion keepContentMounted={true} defaultExpandedKeys={["1"]}>
                <AccordionItem
                  key="1"
                  aria-label="My Sui Fren"
                  title="MY SUIFREN"
                  className="font-serif"
                >
                  <div
                    className="sui-fren-image"
                    dangerouslySetInnerHTML={{ __html: suiFrenSvg || "" }}
                  />
                </AccordionItem>
                <AccordionItem
                  key="2"
                  aria-label="PORT TEMPLE RELICS"
                  title="PORT TEMPLE RELICS"
                  className="font-serif"
                > {/*TODO: here add relic items mint link display*/}
                  <div className="w-full flex flex-col items-center">
                    <h3 className="text-sm font-sans mb-2">
                          a Relic for publish tasks
                    </h3>
                    <Image
                      removeWrapper
                      alt="Trident"
                      src="accessories/trident.svg"
                    />
                    <Button size="sm" className="">
                      <Link
                        href="https://suifrens-testnet-az1ho1jq2-mysten-labs.vercel.app/accessory/magic-wand"
                        isExternal
                        showAnchorIcon
                        className="font-sans"
                      >
                      Get a Trident
                      </Link>
                    </Button>
                  </div>
                </AccordionItem>
                <AccordionItem
                  key="3"
                  aria-label="PASUIPORT"
                  title="PASUIPORT"
                  className="font-serif"
                >
                  <h4 className="text-lg font-semibold text-center font-serif uppercase mb-2">
                        Coming Soon...
                  </h4>
                  <Avatar
                        src={defaultSvgPath}
                        alt="Void Fren"
                        size="lg"
                        className="mb-4 mx-auto rounded-full w-32 h-32 mb-2"
                  />
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoldableSideBar;