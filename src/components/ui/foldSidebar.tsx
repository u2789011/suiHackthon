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
    <div className="flex">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
      >
        {isOpen ? 'Close Sidebar' : 'Open Sidebar'}
      </button>
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out w-64 bg-gray-800 text-white p-4 shadow-lg`}
        style={{ minHeight: '660px' }}
      >
        <div className="sui-fren-container">
          {isError ? (
            <>
              <Avatar
                src={defaultSvgPath}
                alt="Void Fren"
                size="lg"
                className="mb-4 mx-auto rounded-full w-32 h-32"
              />
              <h3 className="font-sans">No SuiFren Yet</h3>
              <Button size="sm">
                <Link
                  href="https://suifrens-testnet-az1ho1jq2-mysten-labs.vercel.app/mint"
                  isExternal
                  showAnchorIcon
                  className="font-sans"
                >
                  Go Get A SuiFren
                </Link>
              </Button>
            </>
          ) : (
            <div>
              <Accordion keepContentMounted={true} defaultExpandedKeys={["1"]}>
                <AccordionItem
                  key="1"
                  aria-label="My Sui Fren"
                  title="MY SUIFREN"
                  className="font-serif"
                >
                  <Card isBlurred>
                    <CardBody>
                      <div
                        className="sui-fren-image"
                        dangerouslySetInnerHTML={{ __html: suiFrenSvg || "" }}
                      />
                    </CardBody>
                  </Card>
                </AccordionItem>
                <AccordionItem
                  key="2"
                  aria-label="SUIFREN ACCESSORIES"
                  title="SUIFREN ACCESSORIES"
                  className="font-serif"
                >
                  <Card isBlurred>
                    <CardHeader>
                      <h4 className="text-2xl font-semibold text-center font-serif uppercase">
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
                <AccordionItem
                  key="3"
                  aria-label="PASUIPORT"
                  title="PASUIPORT"
                  className="font-serif"
                >
                  <Card isBlurred>
                    <CardHeader>
                      <h4 className="text-2xl font-semibold text-center font-serif uppercase">
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