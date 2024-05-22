import BasicDataField from "../fields/basicDataField";
import BasicInputField from "../fields/basicInputField";
import ActionButton from "../buttons/actionButton";
import { SetStateAction, useContext, useMemo, useState } from "react";
import {
  useAccounts,
  useSignAndExecuteTransactionBlock,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { AppContext } from "@/context/AppContext";
import { TransactionBlock } from "@mysten/sui.js/transactions";
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
  Tabs,
  Tab,
  Divider,
} from "@nextui-org/react";

type TaskDescription = {
  description: string;
  format: number; // 0: Plaintext, 1: Markdown
  publish_time: number; // Unix timestamp in milliseconds
};

type Task = {
  id: string;
  version: number;
  name: string;
  description: TaskDescription[];
  image_url: string;
  publish_date: number; // Unix timestamp in milliseconds
  creator: string; // address
  moderator: string; // address
  area: string;
  is_active: boolean; // true: active, false: inactive
  fund: number;
  reward_amount: number;
  task_sheets: any[]; // assuming task_sheets is an array of objects
  poc_img_url: string;
};
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

  const PACKAGE_ID =
    "0xd4395116066d0e6d41a5b041154efaefc3dd8969084a2230732d205549e1bc31";
  const TREASURY_ID =
    "0x4211e66063acb06ca1128b6853cfa86131f3c84740cb74e13b43feaabb311a6d";

  const handleMint = async () => {
    if (!account.address) return;
    const tx = new TransactionBlock();
    const treasuryObj = tx.object(TREASURY_ID);
    const flashMintAmount = tx.pure.u64(1);

    // 1. flash mint
    const [fortuneCoin, recipit] = tx.moveCall({
      target: `${PACKAGE_ID}::fortune::flash_mint`,
      arguments: [treasuryObj, flashMintAmount],
    });

    // 2. mint bag
    const [fortuneBag] = tx.moveCall({
      target: `${PACKAGE_ID}::fortune_bag::mint`,
      arguments: [fortuneCoin],
    });
    // const [fortuneValueInBag] = tx.moveCall({
    //   target: `${PACKAGE_ID}::fortune_bag::fortune_value`,
    //   arguments: [fortuneBag],
    // });

    // 3. take from bag
    const [repayment] = tx.moveCall({
      target: `${PACKAGE_ID}::fortune_bag::take`,
      arguments: [fortuneBag, flashMintAmount],
    });

    // 4. transfer bag to sender
    tx.transferObjects([fortuneBag], account.address);

    // 5. flash burn
    tx.moveCall({
      target: `${PACKAGE_ID}::fortune::flash_burn`,
      arguments: [treasuryObj, repayment, recipit],
    });
    tx.setSender(account.address);

    const dryrunRes = await client.dryRunTransactionBlock({
      transactionBlock: await tx.build({ client: client }),
    });
    console.log(dryrunRes);

    if (dryrunRes.effects.status.status === "success") {
      signAndExecuteTransactionBlock(
        {
          transactionBlock: tx,
          options: {
            showEffects: true,
          },
        },
        {
          onSuccess: (res) => {
            toast.success(`Mint ${res.effects?.created?.length ?? 0} Bag!`);
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
  };

  // const [tasks, setTasks] = useState([
  //   {
  //     id: 1,
  //     name: "任務一",
  //     description: "這是任務一的描述",
  //     image:
  //       "https://github.com/do0x0ob/Sui-Devnet-faucet_coin-EYES/blob/main/faucet_eyes/token_img/_46d4533c-de79-4231-a457-5be2e3fe77af.jpeg?raw=true",
  //     fixedValue: "0x6",
  //   },
  //   {
  //     id: 2,
  //     name: "任務二",
  //     description: "這是任務二的描述",
  //     image:
  //       "https://github.com/do0x0ob/Sui-Devnet-faucet_coin-EYES/blob/main/faucet_eyes/token_img/_46d4533c-de79-4231-a457-5be2e3fe77af.jpeg?raw=true",
  //     fixedValue: "0x6",
  //   },
  //   {
  //     id: 3,
  //     name: "任務三",
  //     description: "這是任務三的描述",
  //     image:
  //       "https://github.com/do0x0ob/Sui-Devnet-faucet_coin-EYES/blob/main/faucet_eyes/token_img/_46d4533c-de79-4231-a457-5be2e3fe77af.jpeg?raw=true",
  //     fixedValue: "0x6",
  //   },
  // ]);

  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    image_url: "",
    area: "",
    reward_amount: "",
    poc_img_url: "",
  });
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [acceptedTasks, setAcceptedTasks] = useState<Task[]>([]);
  const [publishedTasks, setPublishedTasks] = useState<Task[]>([
    {
      id: "1",
      version: 1,
      name: "任務一",
      description: [
        {
          description: "這是任務一的描述。",
          format: 0,
          publish_time: 1684352100000,
        },
      ],
      image_url: "https://example.com/task1.jpg",
      publish_date: 1684352100000,
      creator: "0x1234567890abcdef",
      moderator: "0xfedcba0987654321",
      area: "區域一",
      is_active: true,
      fund: 1000,
      reward_amount: 100,
      task_sheets: [],
      poc_img_url: "https://example.com/poc1.jpg",
    },
    {
      id: "2",
      version: 1,
      name: "任務二",
      description: [
        {
          description: "這是任務二的描述。",
          format: 0,
          publish_time: 1684352200000,
        },
      ],
      image_url: "https://example.com/task2.jpg",
      publish_date: 1684352200000,
      creator: "0xabcdef1234567890",
      moderator: "0x0987654321fedcba",
      area: "區域二",
      is_active: false,
      fund: 2000,
      reward_amount: 200,
      task_sheets: [],
      poc_img_url: "https://example.com/poc2.jpg",
    },
    {
      id: "3",
      version: 1,
      name: "任務三",
      description: [
        {
          description: "這是任務三的描述。",
          format: 0,
          publish_time: 1684352300000,
        },
      ],
      image_url: "https://example.com/task3.jpg",
      publish_date: 1684352300000,
      creator: "0x0123456789abcdef",
      moderator: "0xba9876543210fedc",
      area: "區域三",
      is_active: true,
      fund: 3000,
      reward_amount: 300,
      task_sheets: [],
      poc_img_url: "https://example.com/poc3.jpg",
    },
  ]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleAcceptTask = (taskId: string) => {
    // Logic for accepting task
    const acceptedTask = publishedTasks.find((task) => task.id === taskId);
    const alreadyAccepted = acceptedTasks.some((task) => task.id === taskId);

    if (alreadyAccepted) {
      toast.error("已接過此任務!");
      return;
    }

    if (acceptedTask) {
      setAcceptedTasks([...acceptedTasks, acceptedTask]);
      toast.success(`接受任務成功!`);
    }
    console.log(`Accepted task ${taskId}`);
    console.log(acceptedTask);
  };

  const handlePublishTask = async () => {
    // Logic for publishing task
    //if (!account.address) return;
    // const tx = new TransactionBlock();
    // const [nft] = tx.moveCall({
    //   target: `${PACKAGE_ID}::fortune_bag::mint`,
    //   arguments: [],
    // });
    console.log("New task published:", newTask);
    const newTaskObject = {
      id: (publishedTasks.length + 1).toString(),
      version: 1,
      name: newTask.name,
      description: [
        {
          description: newTask.description,
          format: 0, // 假設默認格式是 plaintext
          publish_time: Date.now(),
        },
      ],
      image_url: newTask.image_url,
      publish_date: Date.now(),
      creator: "0xYourAddress", // 需要用你的地址替代
      moderator: "0xModeratorAddress", // 需要用 moderator 的地址替代
      area: newTask.area,
      is_active: true,
      fund: 1000, // 假設初始基金是 1000
      reward_amount: parseInt(newTask.reward_amount, 10),
      task_sheets: [],
      poc_img_url: newTask.poc_img_url,
    };
    // 將新的任務添加到 publishedTasks 陣列
    setPublishedTasks([...publishedTasks, newTaskObject]);

    // 重置 newTask
    setNewTask({
      name: "",
      description: "",
      image_url: "",
      area: "",
      reward_amount: "",
      poc_img_url: "",
    });
    toast.success(`任務創建成功!`);
  };

  const handleCompleteTask = (taskId: string) => {
    setAcceptedTasks(acceptedTasks.filter((task) => task.id !== taskId));
    toast.success(`任務已完成!`);
    console.log(completedTasks);
  };

  const handleModifyTask = (task: Task) => {
    setSelectedTask(task);
    onOpen();
    console.log(task);
  };

  const handleSaveTaskDetails = () => {
    if (selectedTask) {
      const updatedTasks = publishedTasks.map((task) =>
        task.id === selectedTask.id ? selectedTask : task
      );
      setPublishedTasks(updatedTasks);
      setSelectedTask(null);
      onOpenChange();
      console.log(updatedTasks);
      toast.success("任務詳情已更新!");
    }
  };

  return (
    <>
      <div className="w-[80%] flex flex-col items-center justify-center gap-4 mt-20">
        <BasicDataField
          label="Your Wallet Balance"
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
        />
        <ActionButton
          label="Flash Mint Fortune Bag"
          isConnected={true}
          isLoading={false}
          onClick={handleMint}
          buttonClass="w-70"
        />
      </div>
      <Divider className="my-4" />
      <h1 className="my-4">Fren Suipport Project</h1>
      <div className="mx-auto p-4">
        <Button onPress={onOpen} onClick={() => setSelectedTask(null)}>
          發布任務
        </Button>
      </div>
      <div className="mx-auto p-4">
        <div className="flex w-full flex-col">
          <Tabs aria-label="Options" variant="bordered">
            <Tab key="acceptedTasks" title="已接受任務">
              <div className="max-w-[1200px] gap-2 grid grid-cols-12 grid-rows-2 px-8">
                {acceptedTasks.map((task) => (
                  <Card
                    key={task.id}
                    isFooterBlurred
                    className="col-span-12 sm:col-span-4 h-[300px] w-[300px]"
                  >
                    <CardHeader className="absolute z-10 top-1 flex gap-4 items-start">
                      <Chip
                        color="primary"
                        className=" text-white/80 uppercase font-bold"
                      >
                        {task.id}
                      </Chip>
                      <Chip className=" text-white/80 uppercase font-bold">
                        {task.name}
                      </Chip>
                    </CardHeader>

                    <CardBody>
                      <Image
                        removeWrapper
                        alt="Task"
                        src={task.poc_img_url}
                        className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
                      />
                    </CardBody>
                    <CardFooter className="absolute bg-black/80 bottom-0 z-10 dark:border-default-100">
                      <div className="flex flex-grow gap-2 items-center">
                        <div className="flex flex-col">
                          <p className="text-tiny text-white/80">
                            {task.description[0].description}
                          </p>
                        </div>
                      </div>

                      <Button
                        onPress={() => handleCompleteTask(task.id)}
                        radius="full"
                        size="sm"
                      >
                        回報任務完成
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </Tab>
            <Tab key="publishedTasks" title="已發布任務">
              <div className="max-w-[1200px] gap-2 grid grid-cols-12 grid-rows-2 px-8">
                {publishedTasks.map((task) => (
                  <Card
                    key={task.id}
                    isFooterBlurred
                    className="col-span-12 sm:col-span-4 h-[300px] w-[300px]"
                  >
                    <CardHeader className="absolute z-10 top-1 flex gap-4 items-start">
                      <Chip
                        color="primary"
                        className=" text-white/80 uppercase font-bold"
                      >
                        {task.id}
                      </Chip>
                      <Chip className=" text-white/80 uppercase font-bold">
                        {task.name}
                      </Chip>
                    </CardHeader>

                    <CardBody>
                      <Image
                        removeWrapper
                        alt="Task"
                        src={task.poc_img_url}
                        className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
                      />
                    </CardBody>
                    <CardFooter className="absolute bg-black/80 bottom-0 z-10 dark:border-default-100">
                      <div className="flex flex-grow gap-2 items-center">
                        <div className="flex flex-col">
                          <p className="text-tiny text-white/80">
                            {task.description[0].description}
                          </p>
                        </div>
                      </div>

                      <Button
                        onPress={() => handleModifyTask(task)}
                        radius="full"
                        size="sm"
                      >
                        修改任務詳情
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </Tab>
            <Tab key="completedTasks" title="已完成任務">
              <div className="max-w-[1200px] gap-2 grid grid-cols-12 grid-rows-2 px-8">
                {completedTasks.map((task) => (
                  <Card
                    key={task.id}
                    isFooterBlurred
                    className="col-span-12 sm:col-span-4 h-[300px] w-[300px]"
                  >
                    <CardHeader className="absolute z-10 top-1 flex gap-4 items-start">
                      <Chip
                        color="primary"
                        className=" text-white/80 uppercase font-bold"
                      >
                        {task.id}
                      </Chip>
                      <Chip className=" text-white/80 uppercase font-bold">
                        {task.name}
                      </Chip>
                    </CardHeader>

                    <CardBody>
                      <Image
                        removeWrapper
                        alt="Task"
                        src={task.poc_img_url}
                        className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
                      />
                    </CardBody>
                    <CardFooter className="absolute bg-black/80 bottom-0 z-10 dark:border-default-100">
                      <div className="flex flex-grow gap-2 items-center">
                        <div className="flex flex-col">
                          <p className="text-tiny text-white/80">
                            {task.description[0].description}
                          </p>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
      <Divider className="my-4" />
      <h1 className="my-4">任務列表</h1>
      <div className="max-w-[1200px] gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-8 mb-10">
        {publishedTasks.map((task) => (
          <Card key={task.id} isFooterBlurred className="h-[600px] w-[300px] ">
            <CardHeader className="relative z-10 top-1 flex gap-4 items-start p-4">
              <Chip
                color="primary"
                className=" text-white/80 uppercase font-bold"
              >
                {task.id}
              </Chip>
              <Chip className=" text-white/80 uppercase font-bold">
                {task.name}
              </Chip>
            </CardHeader>

            <CardBody className="relative p-4">
              <Image
                removeWrapper
                alt="Task"
                src={task.image_url}
                className="z-0 w-full h-40 object-cover rounded-lg"
              />
            </CardBody>
            <CardFooter className="absolute bg-black/80 bottom-0 z-10 w-full p-4 flex justify-between items-center">
              <div className="flex flex-grow gap-2 items-center">
                <div className="flex flex-col gap-2 text-white/80">
                  <p>
                    <strong>描述:</strong> {task.description[0].description}
                  </p>
                  <p>
                    <strong>發佈時間:</strong>{" "}
                    {new Date(task.publish_date).toLocaleString()}
                  </p>
                  <p>
                    <strong>創建者:</strong> {task.creator}
                  </p>
                  <p>
                    <strong>主持人:</strong> {task.moderator}
                  </p>
                  <p>
                    <strong>地區:</strong> {task.area}
                  </p>
                  <p>
                    <strong>狀態:</strong>{" "}
                    {task.is_active ? "Active" : "Inactive"}
                  </p>
                  <p>
                    <strong>資金:</strong> {task.fund}
                  </p>
                  <p>
                    <strong>獎勵金額:</strong> {task.reward_amount}
                  </p>
                  <Button
                    onClick={() => handleAcceptTask(task.id)}
                    radius="full"
                    size="sm"
                  >
                    接受任務
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      {/* Modal for publishing task */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {selectedTask ? "修改任務" : "發布新任務"}
              </ModalHeader>
              <ModalBody>
                <Input
                  label="任務名稱"
                  value={selectedTask ? selectedTask.name : newTask.name}
                  onChange={(e) =>
                    selectedTask
                      ? setSelectedTask({
                          ...selectedTask,
                          name: e.target.value,
                        })
                      : setNewTask({ ...newTask, name: e.target.value })
                  }
                />
                <Input
                  label="任務描述"
                  value={
                    selectedTask
                      ? selectedTask.description[0].description
                      : newTask.description
                  }
                  onChange={(e) =>
                    selectedTask
                      ? setSelectedTask({
                          ...selectedTask,
                          description: [
                            {
                              description: e.target.value,
                              format: 0, // 假設格式是 plaintext
                              publish_time: Date.now(), // 假設發布時間是當前時間
                            },
                          ],
                        })
                      : setNewTask({ ...newTask, description: e.target.value })
                  }
                />
                <Input
                  label="任務圖片URL"
                  value={
                    selectedTask ? selectedTask.image_url : newTask.image_url
                  }
                  onChange={(e) =>
                    selectedTask
                      ? setSelectedTask({
                          ...selectedTask,
                          image_url: e.target.value,
                        })
                      : setNewTask({ ...newTask, image_url: e.target.value })
                  }
                />
                <Input
                  label="任務所在地區"
                  value={newTask.area}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      area: e.target.value,
                    })
                  }
                />
                <Input
                  label="任務獎勵金額"
                  value={newTask.reward_amount}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      reward_amount: e.target.value,
                    })
                  }
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={onClose}
                  onClick={() => {
                    setSelectedTask(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={onClose}
                  onClick={() => {
                    selectedTask
                      ? handleSaveTaskDetails()
                      : handlePublishTask();
                  }}
                >
                  {selectedTask ? "保存修改" : "發布"}
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
