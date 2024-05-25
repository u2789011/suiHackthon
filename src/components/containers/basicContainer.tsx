import BasicDataField from "../fields/basicDataField";
import BasicInputField from "../fields/basicInputField";
import ActionButton from "../buttons/actionButton";
import { useContext, useMemo, useState } from "react";
import {
  useAccounts,
  useSignAndExecuteTransactionBlock,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { AppContext } from "@/context/AppContext";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui.js/utils";
import { toast } from "react-toastify";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Image,
  Button,
  Modal,
  Input,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
} from "@nextui-org/react";

const BasicContainer = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { walletAddress, suiName } = useContext(AppContext);
  const { data: suiBalance, refetch } = useSuiClientQuery("getBalance", {
    owner: walletAddress ?? "",
  });
  const [selectedToken, setSelectedToken] = useState<string>("SUI");
  const client = useSuiClient();
  const [account] = useAccounts();
  const { mutate: signAndExecuteTransactionBlock } =
    useSignAndExecuteTransactionBlock();

  const userBalance = useMemo(() => {
    if (suiBalance?.totalBalance) {
      return Math.floor(Number(suiBalance?.totalBalance) / 10 ** 9);
    } else {
      return 0;
    }
  }, [suiBalance]);

  // FIXME: 20240525 test publish package address on devnet
  const PACKAGE_ID =
    "0x8312fbef4e12a25ffcef01086bfd9677cd33beb14d26c9c24b384cc705950bfc";

  const [tasks, setTasks] = useState([
    {
      id: 1,
      name: "任務一",
      description: "這是任務一的描述",
      image:
        "https://github.com/do0x0ob/Sui-Devnet-faucet_coin-EYES/blob/main/faucet_eyes/token_img/_46d4533c-de79-4231-a457-5be2e3fe77af.jpeg?raw=true",
      fixedValue: "0x6",
    },
    /*
    {
      id: 2,
      name: "任務二",
      description: "這是任務二的描述",
      image:
        "https://github.com/do0x0ob/Sui-Devnet-faucet_coin-EYES/blob/main/faucet_eyes/token_img/_46d4533c-de79-4231-a457-5be2e3fe77af.jpeg?raw=true",
      fixedValue: "0x6",
    },
    {
      id: 3,
      name: "任務三",
      description: "這是任務三的描述",
      image:
        "https://github.com/do0x0ob/Sui-Devnet-faucet_coin-EYES/blob/main/faucet_eyes/token_img/_46d4533c-de79-4231-a457-5be2e3fe77af.jpeg?raw=true",
      fixedValue: "0x6",
    },
    */
  ]);

  const [newTask, setNewTask] = useState({
    reward_type: "",
    name: "",
    description: "",
    format:1,
    image: "",
    fixedValue: "0x6",
    area: "",
    mod: "",
    fund: "",
    reward_amount: "",
    poc_img_url: "",
  });

  
  const handleAcceptTask = (taskId: number) => {
    // Logic for accepting task
    console.log(`Accepted task ${taskId}`);
    toast.success(`接受任務成功!`);
  };
  

  // TODO: publish task
  const handlePublishTaskChain = async () => {

    if (!account.address) return;
    const txb = new TransactionBlock();

    txb.moveCall({
      target: `${PACKAGE_ID}::public_task::publish_task`,
      arguments: [
        txb.pure.string(newTask.name),
        txb.pure.string(newTask.description),
        txb.pure(newTask.format),
        txb.pure.string(newTask.image),
        txb.pure(SUI_CLOCK_OBJECT_ID),
        txb.pure.string(newTask.area),
        txb.pure.address(newTask.mod),
        txb.object(newTask.fund),
        txb.pure(newTask.reward_amount),
        txb.pure.string(newTask.poc_img_url),
      ],
      typeArguments: [newTask.reward_type]
    });

    txb.setSender(account.address);

    const dryrunRes = await client.dryRunTransactionBlock({
      transactionBlock: await txb.build({ client: client }),
    });
    console.log(dryrunRes);
  

    if (dryrunRes.effects.status.status === "success") {
      signAndExecuteTransactionBlock(
        {
          transactionBlock: txb,
          options: {
            showEffects: true,
          },
        },
        {
          onSuccess: (res) => {
            toast.success(`發送成功！`);
            refetch();
          },
          onError: (err) => {
            toast.error("Tx Failed!");
            console.log(err);
          },
        }
      );
    } else {
      toast.error("Something went wrong");
    }
   


    console.log("New task published:", newTask);
    setTasks([...tasks, { id: tasks.length + 1, ...newTask }]);
    setNewTask({ reward_type: "", name: "", description: "", format: 1, image: "", fixedValue: "0x6", area:"", mod:"", fund:"",reward_amount: "", poc_img_url: "", });
    toast.success(`發送成功`);
  };

  return (
    <>
      <div className="w-[80%] flex flex-col items-center justify-center gap-4 mt-20">
        <BasicDataField
          label="Wallet Balance"
          value={userBalance ?? "0.0000"}
          spaceWithUnit
          unit="SUI"
          minFractionDigits={0}
        />
        <BasicInputField
          label="Input"
          inputValue="0.0000"
          setInputValue={(value) => console.log(value)}
          tokenInfo={["SUI", "BUCK", "USDC", "USDT"]}
          canSelectToken={true}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
          maxValue={0.0}

      /*/>
        <ActionButton
          label="Flash Mint Fortune Bag"
          isConnected={true}
          isLoading={false}
          onClick={handleMint}
       */   
        />
      </div>
      <div className="mx-auto p-4">
        <Button onPress={onOpen}>Publish Task</Button>
      </div>
      <div className="max-w-[900px] gap-2 grid grid-cols-12 grid-rows-2 px-8 mb-10">
        {tasks.map((task) => (
          <Card
            key={task.id}
            isFooterBlurred
            className="col-span-12 sm:col-span-4 h-[300px]"
          >
            <CardHeader className="absolute z-10 top-1 flex-col items-start">
              <Chip className=" text-white/80 uppercase font-bold">
                {task.name}
              </Chip>
            </CardHeader>

            <CardBody>
              <Image
                removeWrapper
                alt="Task"
                src={task.image}
                className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
              />
            </CardBody>
            <CardFooter className="absolute bg-black/80 bottom-0 z-10 dark:border-default-100">
              <div className="flex flex-grow gap-2 items-center">
                <div className="flex flex-col">
                  <p className="text-tiny text-white/80">{task.description}</p>
                </div>
              </div>
              <Button
                onClick={() => handleAcceptTask(task.id)}
                radius="full"
                size="md"
              >
                接受任務
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {/* Modal for publishing task */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Mint a Task
              </ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="Reward Type"
                  placeholder="Enter the Reward Type"
                  variant="bordered"
                  value={newTask.reward_type}
                  onChange={(e) =>
                    setNewTask({ ...newTask, reward_type: e.target.value })
                  }
                />
                <Input
                  autoFocus
                  label="Task Name"
                  placeholder="Please Input Task Name"
                  variant="bordered"
                  value={newTask.name}
                  onChange={(e) =>
                    setNewTask({ ...newTask, name: e.target.value })
                  }
                />
                <Input
                  label="Description"
                  placeholder="Input Some Description of Your Task"
                  variant="bordered"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                />
                <Input
                  label="Task Image"
                  placeholder="Input Image URL"
                  variant="bordered"
                  value={newTask.image}
                  onChange={(e) =>
                    setNewTask({ ...newTask, image: e.target.value })
                  }
                />
                <Input
                  label="Area"
                  placeholder="Where the Task is Availible"
                  variant="bordered"
                  value={newTask.area}
                  onChange={(e) =>
                    setNewTask({ ...newTask, area: e.target.value })
                  }
                />
                <Input
                  label="MOD"
                  placeholder="Input MOD address"
                  variant="bordered"
                  value={newTask.mod}
                  onChange={(e) =>
                    setNewTask({ ...newTask, mod: e.target.value })
                  }
                />
                <Input
                  label="fund"
                  placeholder="Input Fund Object"
                  variant="bordered"
                  value={newTask.fund}
                  onChange={(e) =>
                    setNewTask({ ...newTask, fund: e.target.value })
                  }
                />
                <Input
                  label="Reward Amount"
                  placeholder="Reward Amount for Each Tasker"
                  variant="bordered"
                  value={newTask.reward_amount}
                  onChange={(e) =>
                    setNewTask({ ...newTask, reward_amount: e.target.value })
                  }
                />
                <Input
                  label="Proof of completion Image URL"
                  placeholder="Set the URL for Proof for Completion NFT"
                  variant="bordered"
                  value={newTask.poc_img_url}
                  onChange={(e) =>
                    setNewTask({ ...newTask, poc_img_url: e.target.value })
                  }
                />
                <Input disabled label="Fix Field" value={newTask.fixedValue} />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={onClose}
                  onClick={handlePublishTaskChain} //FIXME: TEST Change
                >
                  Mint Task
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default BasicContainer;
