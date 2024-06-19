import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Avatar,
  Accordion,
  AccordionItem,
  Link,
  Button,
} from "@nextui-org/react";

interface SuifrenCard2Props {
  suiFrenSvg: string | null;
  isError: boolean;
}

const SuifrenCard2: React.FC<SuifrenCard2Props> = ({ suiFrenSvg, isError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const defaultSvgPath = "/frens/voidfren.svg";

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 transform -translate-y-1/2 bg-orange-400 bg-opacity-95 text-white text-center px-2 py-1 rounded-r-xl transition-transform duration-360 ease-in-out ${
          isOpen ? 'left-70' : 'left-0'
        }`}
        style={{ zIndex: 1001 }}
      >
        {isOpen ? 'X' : '>'}
      </button>
      <div
        className={`fixed left-0 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-360 ease-in-out w-72 backdrop-blur-lg text-white p-4 shadow-lg rounded-r-4xl`}
        style={{ minHeight: '480px', maxHeight: '90vh', top: '50%', transform: `translateY(-50%) ${isOpen ? 'translateX(0)' : 'translateX(-100%)'}`, zIndex: 1000 }}
      >
        <div className="sui-fren-container overflow-auto w-full">
          {isError ? (
            <div className="w-full flex flex-col items-center">
              <Avatar
                src={defaultSvgPath}
                alt="Void Fren"
                size="lg"
                className="mb-4 mx-auto rounded-full w-32 h-32"
              />
              <h3 className="font-sans text-center">No SuiFren Yet</h3>
              <Button size="sm" className="mx-auto">
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
                  aria-label="SUIFREN ACCESSORIES"
                  title="SUIFREN ACCESSORIES"
                  className="font-serif"
                >
                  <Card isBlurred>
                    <CardHeader>
                      <h4 className="text-lg font-semibold text-center font-serif uppercase">
                        Coming Soon...
                      </h4>
                    </CardHeader>
                    <CardBody>
                      <Avatar
                        src={defaultSvgPath}
                        alt="Void Fren"
                        size="lg"
                        className="mx-auto rounded-full w-32 h-32"
                      />
                    </CardBody>
                  </Card>
                </AccordionItem>
                <AccordionItem
                  key="3"
                  aria-label="PASUIPORT"
                  title="PASUIPORT"
                  className="font-serif"
                >
                  <Card isBlurred>
                    <CardHeader>
                      <h4 className="text-lg font-semibold text-center font-serif uppercase">
                        Coming Soon...
                      </h4>
                    </CardHeader>
                    <CardBody>
                      <Avatar
                        src={defaultSvgPath}
                        alt="Void Fren"
                        size="lg"
                        className="mb-4 mx-auto rounded-full w-32 h-32"
                      />
                    </CardBody>
                  </Card>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuifrenCard2;