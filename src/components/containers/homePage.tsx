import React from "react";
import { Button, Card, Image, Avatar, Divider } from "@nextui-org/react";
import "tailwindcss/tailwind.css";
import BasicContainer from "./basicContainer";
const HomePage = () => {
  const [isDappMode, setIsDappMode] = React.useState(false);
  const teamMembers = [
    {
      name: "d0x0b.sui",
      role: "Move & Front-end",
      avatar: "https://i.postimg.cc/BQmgkhPs/Snipaste-2024-05-31-03-06-50.png",
    },
    {
      name: "A5HL3yz",
      role: "Front-end & Back-end",
      avatar: "https://i.postimg.cc/kXJsjr4f/Ashley-from-Photopea.png",
    },
    {
      name: "Zhi Xiang",
      role: "Documentation & Case studies",
      avatar: "https://i.postimg.cc/sXPPcKCk/267748-0.jpg",
    },
    {
      name: "OhYeah!",
      role: "Presentation",
      avatar: "https://i.postimg.cc/d342M11n/267747-0.jpg",
    },
    {
      name: "Sheng Yun",
      role: "Presentation",
      avatar: "https://i.postimg.cc/BZgcPhgD/267752-0.jpg",
    },
  ];
  return (
    <>
      {isDappMode && (
        <>
          <BasicContainer />
        </>
      )}
      {!isDappMode && (
        <div className=" min-h-screen p-8 ">
          <header className="flex flex-col justify-center items-center text-center min-h-screen mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-yellow-500 text-transparent bg-clip-text font-serif uppercase">
              Fren Suipport
            </h1>
            <h2 className="text-2xl bg-gradient-to-r from-pink-500 to-yellow-500 text-transparent bg-clip-text font-sans">
              Addressing Funding Bottlenecks in the Web3 Ecosystem
            </h2>
            <Button
              radius="full"
              size="lg"
              className="text-2xl  bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg mt-10 font-serif "
              onClick={() => {
                setIsDappMode(true);
              }}
            >
              Start Now
            </Button>
            <div className="scroll-down mt-10 font-sans">
              <span>Scroll down for more info</span>
              <div className="arrow"></div>
            </div>
          </header>

          <main>
            <section className="mb-12">
              <Card className="p-6 shadow-lg" isBlurred={true}>
                <h3 className="text-3xl font-semibold mb-4 font-serif text-center">
                  About Us
                </h3>
                <p className="text-lg mb-4 font-sans text-center">
                  We are a team from the Blockchain Research club at National
                  Chung Hsing University, <br />
                  dedicated to improving the Web3 ecosystem.
                </p>

                <div className="flex flex-wrap justify-center">
                  {teamMembers.map((member, index) => (
                    <Card
                      key={index}
                      className="p-4 m-4 shadow-md w-60"
                      isHoverable={true}
                    >
                      <Avatar
                        src={member.avatar}
                        size="lg"
                        className="mb-4 mx-auto rounded-full w-32 h-32"
                      />
                      <h4 className="text-xl font-semibold text-center font-serif">
                        {member.name}
                      </h4>
                      <p className="text-center font-sans">{member.role}</p>
                    </Card>
                  ))}
                </div>
              </Card>
            </section>
            {/* Our Goals Section */}
            <section className="mb-12">
              <Card className="p-6 shadow-lg" isBlurred={true}>
                <h3 className="text-2xl font-semibold mb-4 text-center font-serif">
                  Our Goals
                </h3>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Card
                    className="p-4 shadow-md w-full sm:w-1/3"
                    isHoverable={true}
                  >
                    <Image
                      src="https://suifrens.com/images/learn-top-right.svg"
                      alt="Objective 1 Image"
                      className="w-full h-32 object-cover mb-4"
                    />
                    <h4 className="text-2xl font-semibold mb-2 font-serif text-center">
                      Objective 1
                    </h4>
                    <p className="text-center font-sans">
                      Develop a seamless platform for value exchange through
                      production and labor, reducing reliance on traditional
                      funding sources.
                    </p>
                  </Card>
                  <Card
                    className="p-4 shadow-md w-full sm:w-1/3"
                    isHoverable={true}
                  >
                    <Image
                      src="https://suifrens.com/images/learn-bottom-right.svg"
                      alt="Objective 2 Image"
                      className="w-full h-32 object-cover mb-4"
                    />
                    <h4 className="text-2xl font-semibold mb-2 font-serif text-center">
                      Objective 2
                    </h4>
                    <p className="text-center font-sans">
                      Enhance transparency in fundraising using decentralized
                      systems to ensure fair distribution and use of funds.
                    </p>
                  </Card>
                  <Card
                    className="p-4 shadow-md w-full sm:w-1/3"
                    isHoverable={true}
                  >
                    <Image
                      src="https://suifrens.com/images/learn-bottom-left.svg"
                      alt="Objective 3 Image"
                      className="w-full h-32 object-cover mb-4"
                    />
                    <h4 className="text-2xl font-semibold mb-2 font-serif text-center">
                      Objective 3
                    </h4>
                    <p className="text-center font-sans">
                      Promote fairness and equity through smart contracts,
                      ensuring fair task allocation and fund distribution.
                    </p>
                  </Card>
                </div>
              </Card>
            </section>

            {/* Values Section */}
            <section className="mb-12">
              <Card className="p-6 shadow-lg" isBlurred={true}>
                <h3 className="text-2xl font-semibold mb-4  text-center font-serif">
                  Values
                </h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <Card
                    className="p-4 shadow-md w-full sm:w-1/2"
                    isHoverable={true}
                  >
                    <Image
                      src="https://suifrens.com/images/accessorize-right.svg"
                      alt="Accessibility Image"
                      className="w-full h-32 object-cover mb-4"
                    />
                    <h4 className="text-2xl font-semibold mb-2 font-serif">
                      Accessibility
                    </h4>
                    <p className="font-sans">
                      Create an inclusive platform with user-friendly interfaces
                      and tools for easy initiation and management of
                      fundraising activities.
                    </p>
                  </Card>
                  <Card
                    className="p-4 shadow-md w-full sm:w-1/2"
                    isHoverable={true}
                  >
                    <Image
                      src="https://suifrens.com/images/accessorize-left.svg"
                      alt="Fairness Image"
                      className="w-full h-32 object-cover mb-4"
                    />
                    <h4 className="text-2xl font-semibold mb-2 font-serif">
                      Fairness
                    </h4>
                    <p className="font-sans">
                      Promote equitable distribution of resources and
                      opportunities through smart contracts, minimizing biases
                      and fraud.
                    </p>
                  </Card>
                </div>
              </Card>
            </section>

            {/* Project Roadmap Section */}
            <section className="mb-12">
              <Card className="p-6 shadow-lg" isBlurred={true}>
                <h3 className="text-2xl font-semibold mb-4 text-center font-serif">
                  Project Roadmap
                </h3>
                <div className="relative mb-6 mt-6">
                  <div className="h-2 bg-gray-300 rounded-full">
                    <div className="h-2 bg-gradient-to-tr from-pink-500 to-yellow-500 rounded-full w-1/4"></div>
                  </div>
                  <p className="absolute top-0 right-0 mt-2 text-sm font-serif">
                    25%
                  </p>
                </div>
                <div className="flex flex-wrap justify-center">
                  <Card
                    className="p-4 shadow-md w-full sm:w-1/4"
                    isHoverable={true}
                    isBlurred
                  >
                    <h4 className="text-xl font-semibold mb-2  text-center font-serif">
                      Public Task
                    </h4>
                    <p className="font-sans">
                      Foundations or organizations post tasks, participants
                      accept and submit tasks, and upon verification, smart
                      contracts disburse funds.
                    </p>
                  </Card>
                  <Card
                    className="p-4 shadow-md w-full sm:w-1/4"
                    isHoverable={true}
                    isBlurred
                  >
                    <h4 className="text-xl font-semibold mb-2 text-center font-serif">
                      Fund Raising
                    </h4>
                    <p className="font-sans">
                      Platform for individuals or non-recurring events to raise
                      funds, with contributors forming a DAO to manage fund
                      utilization.
                    </p>
                  </Card>
                  <Card
                    className="p-4 shadow-md w-full sm:w-1/4"
                    isHoverable={true}
                    isBlurred
                  >
                    <h4 className="text-xl font-semibold mb-2 text-center font-serif">
                      Personal Task
                    </h4>
                    <p className="font-sans">
                      Facilitates posting private tasks with limited
                      participants, eliminating high intermediary fees for
                      direct labor exchange.
                    </p>
                  </Card>
                  <Card
                    className="p-4 shadow-md w-full sm:w-1/4"
                    isHoverable={true}
                    isBlurred
                  >
                    <h4 className="text-xl font-semibold mb-2 text-center font-serif">
                      Vendors
                    </h4>
                    <p className="font-sans">
                      Vendors issue NFTs linked to real-world items, enabling
                      on-chain sales and free trade of items using Sui object
                      properties.
                    </p>
                  </Card>
                </div>
              </Card>
            </section>

            <section className="mb-10">
              <Card
                className="p-6 shadow-lg"
                isBlurred={true}
                isHoverable={true}
              >
                <h3 className="text-2xl font-semibold mb-4 text-center font-serif">
                  Upcoming Features
                </h3>
                <p className="text-lg mb-4 font-sans text-center">
                  We have many exciting features planned, including community
                  feedback mechanisms and honorary accessory rewards for
                  contributors.
                </p>
                <Image
                  src="../images/Trade Off Upcoming Features (2).jpg"
                  alt="Upcoming Features"
                  className="mb-3"
                />
                <Image
                  src="../images/Trade Off Upcoming Features (3).jpg"
                  alt="Upcoming Features"
                  className="mb-3"
                />
                <Image
                  src="../images/Trade Off Upcoming Features.jpg"
                  alt="Upcoming Features"
                />
              </Card>
            </section>
          </main>
        </div>
      )}
    </>
  );
};

export default HomePage;
