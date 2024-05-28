import BasicDataField from "../fields/basicDataField";
import BasicInputField from "../fields/basicInputField";
import ActionButton from "../buttons/actionButton";
import {
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  Tabs,
  Tab,
  Divider,
  ScrollShadow,
  Link,
  CheckboxGroup,
  Checkbox,
  Textarea,
} from "@nextui-org/react";
import { log } from "console";

type SuiObjectResponse = any;

type TaskDescription = {
  description: string;
  format: number; // 0: Plaintext, 1: Markdown
  publish_time: number; // Unix timestamp in milliseconds
};

type Task = {
  reward_type: string;
  id: string;
  version: number;
  name: string;
  description: TaskDescription[];
  image_url: string;
  publish_date: string; // Unix timestamp in milliseconds
  creator: string; // address
  moderator: string; // address
  area: string;
  is_active: boolean; // true: active, false: inactive
  fund: string;
  reward_amount: number;
  task_sheets: any[]; // assuming task_sheets is an array of objects
  poc_img_url: string;
};

const BasicContainer = () => {
  const {
    isOpen: isOpenModal1,
    onOpen: onOpenModal1,
    onOpenChange: onOpenChangeModal1,
  } = useDisclosure();
  const {
    isOpen: isOpenModal2,
    onOpen: onOpenModal2,
    onOpenChange: onOpenChangeModal2,
  } = useDisclosure();
  const {
    isOpen: isOpenModal3,
    onOpen: onOpenModal3,
    onOpenChange: onOpenChangeModal3,
  } = useDisclosure();
  const {
    isOpen: isOpenModal4,
    onOpen: onOpenModal4,
    onOpenChange: onOpenChangeModal4,
  } = useDisclosure();
  const { walletAddress, suiName } = useContext(AppContext);
  const { data: suiBalance, refetch } = useSuiClientQuery("getBalance", {
    owner: walletAddress ?? "",
  });
  const { data: allCoins } = useSuiClientQuery("getAllCoins", {
    owner: walletAddress ?? "",
  })
  const { data: ownedObjects } = useSuiClientQuery("getOwnedObjects", {
    owner: walletAddress ?? "",
  })
  const [selectedToken, setSelectedToken] = useState<string>("SUI");
  const client = useSuiClient();
  const [account] = useAccounts();
  const { mutate: signAndExecuteTransactionBlock } =
    useSignAndExecuteTransactionBlock();
  const truncateAddress = (address: string | any[]) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  const userBalance = useMemo(() => {
    if (suiBalance?.totalBalance) {
      return Math.floor(Number(suiBalance?.totalBalance) / 10 ** 9);
    } else {
      return 0;
    }
  }, [suiBalance]);

  // version 20240527
  const PACKAGE_ID =
    "0x2e9fe44a82ef679c0d2328ce71b31ad5be9669f649b154441fe01f096344c000";
  const TASK_MANAGER_ID =
    "0x2dc234a74eaf194314ec3641583bed3e61738048327d4c029ae0ca9b9920d779";
  const FLOAT_SCALING = 1000000000;

  const [newTask, setNewTask] = useState({
    reward_type: "",
    name: "",
    description: "",
    format: 1,
    image_url: "",
    area: "",
    is_active: true,
    reward_amount: "",
    poc_img_url: "",
    creator: "",
    moderator: "",
    fund: "",
  });
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [acceptedTasks, setAcceptedTasks] = useState<Task[]>([]);
  const [publishedTasks, setPublishedTasks] = useState<Task[]>([]);

  async function fetchTaskList() {
    try {
      const taskManagerObject = await client.getObject({
        id: TASK_MANAGER_ID,
        options: {
          showContent: true,
        },
      });

      const jsonString = JSON.stringify(taskManagerObject, null, 2);
      const jsonObject = JSON.parse(jsonString);
      const publishedTaskIdsArr =
        jsonObject.data.content.fields.published_tasks;

      // console.log(publishedTaskIdsArr); FIXME: Test Use Only
      return publishedTaskIdsArr;
    } catch (error) {
      console.error("Error fetching or converting task manager object:", error);
      return [];
    }
  }

  async function fetchPublishedList() {
    try {
      const publishedTaskIdsArr = await fetchTaskList();

      const multiGetObjectsParams = {
        ids: publishedTaskIdsArr,
        options: {
          showContent: true,
        },
      };

      const objectsResponse = await client.multiGetObjects(
        multiGetObjectsParams
      );

      console.log(allCoins); //FIXME: Test Use Only
      console.log(ownedObjects); //FIXME: Test Use Only
      return objectsResponse;
    } catch (error) {
      console.error("Error fetching multiple objects:", error);
      return null;
    }
  }

  function transformData(apiData: SuiObjectResponse[]): Task[] {
    if (!apiData) return [];

    return apiData.map((item) => {
      const fields = item.data.content.fields;
      const type = item.data.content.type;
      const descriptionField = fields.description[0].fields;

      return {
        reward_type: (type.match(/<([^>]+)>/) || [])[1] || "",
        id: fields.id.id,
        version: fields.version,
        name: fields.name,
        description: [
          {
            description: descriptionField.description,
            format: parseInt(descriptionField.format),
            publish_time: parseInt(descriptionField.publish_time),
          },
        ],
        image_url: fields.image_url,
        publish_date: fields.publish_date.toString(), // 轉換為 string 類型
        creator: fields.creator,
        moderator: fields.moderator,
        area: fields.area,
        is_active: fields.is_active,
        fund: fields.fund,
        reward_amount: parseFloat(fields.reward_amount),
        task_sheets: fields.task_sheets,
        poc_img_url: fields.poc_img_url,
      };
    });
  }

  async function fetchData() {
    const apiData = await fetchPublishedList();
    if (apiData) {
      const transformedData = transformData(apiData);
      setPublishedTasks(transformedData);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleAcceptTask = async (selectedTask: Task) => {
    if (!account.address) return;
    const txb = new TransactionBlock();
    console.log(selectedTask);
    txb.moveCall({
      target: `${PACKAGE_ID}::public_task::mint_task_sheet`,
      arguments: [txb.object(selectedTask.id), txb.pure(SUI_CLOCK_OBJECT_ID)],
      typeArguments: [selectedTask.reward_type],
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
          onSuccess: async (res) => {
            try {
              const digest = await txb.getDigest({ client: client });
              toast.success(`Transaction Sent, ${digest}`);
              console.log(`Transaction Digest`, digest);
            } catch (digestError) {
              if (digestError instanceof Error) {
                toast.error(
                  `Transaction sent, but failed to get digest: ${digestError.message}`
                );
              } else {
                toast.error(
                  "Transaction sent, but failed to get digest due to an unknown error."
                );
              }
            }
            refetch();
            fetchData();
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
    // Logic for accepting task
    const acceptedTask = publishedTasks.find(
      (task) => task.id === selectedTask.id
    );

    if (acceptedTask) {
      setAcceptedTasks([...acceptedTasks, acceptedTask]);
      // toast.success(`接受任務成功!`);
    }
    console.log(`Accepted task ${selectedTask.id}`);
    console.log(acceptedTask);
  };



  const handlePublishTaskChain = async () => {
    if (!account.address) return;
    const txb = new TransactionBlock();

    txb.moveCall({
      target: `${PACKAGE_ID}::public_task::publish_task`,
      arguments: [
        txb.pure.string(newTask.name),
        txb.pure.string(newTask.description),
        txb.pure(newTask.format),
        txb.pure.string(newTask.image_url),
        txb.pure(SUI_CLOCK_OBJECT_ID),
        txb.pure.string(newTask.area),
        txb.pure(true),
        txb.pure.address(newTask.moderator),
        txb.object(newTask.fund),
        txb.pure(parseFloat(newTask.reward_amount) * FLOAT_SCALING),
        txb.pure.string(newTask.poc_img_url),
        txb.pure(TASK_MANAGER_ID),
      ],
      typeArguments: [newTask.reward_type],
    });

    txb.setSender(account.address);

    const dryrunRes = await client.dryRunTransactionBlock({
      transactionBlock: await txb.build({ client: client }),
    });
    console.log(dryrunRes);

    if (dryrunRes.effects.status.status === "success") {
      let createdObject = "";

      await signAndExecuteTransactionBlock(
        {
          transactionBlock: txb,
          options: {
            showEffects: true,
          },
        },
        {
          onSuccess: async (res) => {
            try {
              const created = res.effects?.created;
              if (created === undefined || created.length === 0) {
                throw new Error("No object created.");
              }
              for (let i = 0; i < created.length; i++) {
                const potentialObject = created[i].reference?.objectId;
                if (
                  created[i].owner !== account.address &&
                  potentialObject !== undefined &&
                  typeof potentialObject === "string"
                ) {
                  createdObject = potentialObject;
                  console.log(createdObject);
                  break;
                }
              }
              const potentialObject =
                res.effects?.created?.[0]?.reference?.objectId;
              if (
                potentialObject !== undefined &&
                typeof potentialObject === "string"
              ) {
                createdObject = potentialObject;
                console.log(createdObject);
              } else {
                throw new Error("Created object ID is not a string.");
              }

              const digest = await txb.getDigest({ client: client });
              toast.success(`Transaction Sent, ${digest}`);
              console.log(`Transaction Digest`, digest);

              // Create New Task Object
              const newTaskObject = {
                reward_type: newTask.reward_type,
                id: createdObject,
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
                publish_date: SUI_CLOCK_OBJECT_ID,
                creator: account.address, // 需要用你的地址替代
                moderator: newTask.moderator, // 需要用 moderator 的地址替代
                area: newTask.area,
                is_active: true,
                fund: newTask.fund, // 假設初始基金是 1000
                reward_amount: parseInt(newTask.reward_amount),
                task_sheets: [],
                poc_img_url: newTask.poc_img_url,
              };

              setPublishedTasks((prevTasks) => [...prevTasks, newTaskObject]);

              await fetchData();

              // FIXME: for test only
              // Reset Task
              setNewTask({
                reward_type: "0x2::sui::SUI",
                name: "測試",
                description: "測試",
                format: 1,
                image_url:
                  "https://github.com/do0x0ob/Sui-Devnet-faucet_coin-EYES/blob/main/faucet_eyes/token_img/_46d4533c-de79-4231-a457-5be2e3fe77af.jpeg?raw=true",
                area: "TW",
                reward_amount: "",
                poc_img_url: "https://suifrens.com/images/header-mobile.svg",
                creator: account.address || "0xYourAddress",
                moderator: account.address || "0xModeratorAddress",
                fund: "1",
                is_active: true,
              });
            } catch (digestError) {
              if (digestError instanceof Error) {
                toast.error(
                  `Transaction sent, but failed to get digest: ${digestError.message}`
                );
              } else {
                toast.error(
                  "Transaction sent, but failed to get digest due to an unknown error."
                );
              }
            }
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
  };

  const handleCompleteTask = (task: Task) => {
    setSelectedTask(task);
    onOpenModal4();
    console.log("Send Task Sheet", task);
  };

  const handleSendTaskSheet = () => {
    if (selectedTask) {
      toast.success("任務完成申請已送出!");
      setSelectedTask(null);
    }
  };

  const handleModifyTask = (task: Task) => {
    setSelectedTask(task);
    onOpenModal3();
    console.log(task);
  };

  const handleSaveTaskDetails = () => {
    if (selectedTask) {
      // const updatedTasks = publishedTasks.map((task) =>
      //   task.id === selectedTask.id ? selectedTask : task
      // );
      // setPublishedTasks(updatedTasks);
      setSelectedTask(null);
      onOpenChangeModal3();
      toast.success("任務詳情已更新!");
    }
  };

  const handleSubmittedTask = (task: Task) => {
    setSelectedTask(task);
    console.log("Submitted Task", task);
    onOpenModal2();
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
      </div>
      <Divider className="my-4"></Divider>
      <div className="mx-auto p-4">
        <Button
          onPress={onOpenModal1}
          onClick={(handlePublishTaskChain) => setSelectedTask(null)}
        >
          Publish Task
        </Button>
      </div>
      <Divider className="my-4" />
      <h1 className="my-4">任務列表</h1>
      <div className="flex justify-center p-4">
        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Options"
            variant="bordered"
            className="min-h-1 mx-auto p-4"
          >
            <Tab key="allTasks" title="所有任務">
              {" "}
              <div className="max-w-[1200px] gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-8 mb-10">
                {publishedTasks.map((task) => (
                  <Card
                    key={task.id}
                    isFooterBlurred
                    className="h-[600px] w-[300px] "
                  >
                    {/* <CardHeader className="relative z-10 top-1 flex gap-4 items-start p-4">
              <Chip
                color="primary"
                className=" text-white/80 uppercase font-bold"
              >
                {truncateAddress(task.id)}
              </Chip>
            </CardHeader> */}

                    <CardBody className="relative p-4">
                      <Image
                        removeWrapper
                        alt="Task"
                        src={task.image_url}
                        className="z-0 w-full h-50 object-cover rounded-lg"
                      />
                    </CardBody>
                    <CardFooter className="absolute bg-black/80 bottom-0 z-10 w-full p-4 flex justify-between items-center">
                      <div className="flex flex-grow gap-2 items-center">
                        <div className="flex flex-col gap-2 text-white/80">
                          <ScrollShadow hideScrollBar className="h-[230px]">
                            <p>
                              <strong>任務名稱:</strong> {task.name}
                            </p>

                            <p>
                              <strong>描述:</strong>{" "}
                              {task.description[0].description}
                            </p>

                            <p>
                              <strong>發佈時間:</strong>{" "}
                              {new Date(
                                parseInt(task.publish_date)
                              ).toLocaleString()}
                            </p>
                            <p>
                              <strong>創建者:</strong>{" "}
                              {truncateAddress(task.creator)}
                            </p>
                            <p>
                              <strong>主持人:</strong>{" "}
                              {truncateAddress(task.moderator)}
                            </p>
                            <p>
                              <strong>地區:</strong> {task.area}
                            </p>
                            <p>
                              <strong>狀態:</strong>{" "}
                              {task.is_active ? "Active" : "Inactive"}
                            </p>
                            <p>
                              <strong>資金:</strong> {parseFloat(task.fund) / FLOAT_SCALING}
                            </p>
                            <p>
                              <strong>獎勵金額:</strong> {task.reward_amount / FLOAT_SCALING}
                            </p>
                            <Link
                              isExternal
                              href={`https://suiscan.xyz/devnet/object/${task.id}`}
                              showAnchorIcon
                            >
                              在區塊鏈上查看
                            </Link>
                          </ScrollShadow>
                          <Button
                            isDisabled={!task.is_active}
                            onClick={() => handleAcceptTask(task)}
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
            </Tab>
            <Tab key="acceptedTasks" title="已接受任務">
              <div className="max-w-[1200px] gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-8 mb-10">
                {acceptedTasks.map((task) => (
                  <Card
                    key={task.id}
                    isFooterBlurred
                    className="h-[600px] w-[300px] "
                  >
                    {/* <CardHeader className="relative z-10 top-1 flex gap-4 items-start p-4">
                      <Chip
                        color="primary"
                        className=" text-white/80 uppercase font-bold"
                      >
                        {truncateAddress(task.id)}
                      </Chip>
                    </CardHeader> */}
                    <CardBody className="relative p-4">
                      <Image
                        removeWrapper
                        alt="Task"
                        src={task.image_url}
                        className="z-0 w-full h-50 object-cover rounded-lg"
                      />
                    </CardBody>
                    <CardFooter className="absolute bg-black/80 bottom-0 z-10 w-full p-4 flex justify-between items-center">
                      <div className="flex flex-grow gap-2 items-center">
                        <div className="flex flex-col gap-2 text-white/80">
                          <ScrollShadow hideScrollBar className="h-[230px]">
                            <p>
                              <strong>任務名稱:</strong> {task.name}
                            </p>

                            <p>
                              <strong>描述:</strong>{" "}
                              {task.description[0].description}
                            </p>

                            <p>
                              <strong>發佈時間:</strong>{" "}
                              {new Date(
                                parseInt(task.publish_date)
                              ).toLocaleString()}
                            </p>
                            <p>
                              <strong>創建者:</strong>{" "}
                              {truncateAddress(task.creator)}
                            </p>
                            <p>
                              <strong>主持人:</strong>{" "}
                              {truncateAddress(task.moderator)}
                            </p>
                            <p>
                              <strong>地區:</strong> {task.area}
                            </p>
                            <p>
                              <strong>狀態:</strong>{" "}
                              {task.is_active ? "Active" : "Inactive"}
                            </p>
                            <p>
                              <strong>資金:</strong> {parseFloat(task.fund) / FLOAT_SCALING}
                            </p>
                            <p>
                              <strong>獎勵金額:</strong> {task.reward_amount / FLOAT_SCALING}
                            </p>
                            <Link
                              isExternal
                              href={`https://suiscan.xyz/devnet/object/${task.id}`}
                              showAnchorIcon
                            >
                              在區塊鏈上查看
                            </Link>
                          </ScrollShadow>
                          <Button
                            onPress={() => handleCompleteTask(task)}
                            radius="full"
                            size="sm"
                          >
                            回報任務完成
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </Tab>
            <Tab key="publishedTasks" title="已發布任務">
              <div className="max-w-[1200px] gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-8 mb-10">
                {publishedTasks.map((task) => (
                  <Card
                    key={task.id}
                    isFooterBlurred
                    className="h-[600px] w-[300px] "
                  >
                    {/* <CardHeader className="relative z-10 top-1 flex gap-4 items-start p-4">
                      <Chip
                        color="primary"
                        className=" text-white/80 uppercase font-bold"
                      >
                        {truncateAddress(task.id)}
                      </Chip>
                    </CardHeader> */}

                    <CardBody className="relative p-4">
                      <Image
                        removeWrapper
                        alt="Task"
                        src={task.image_url}
                        className="z-0 w-full h-50 object-cover rounded-lg"
                      />
                    </CardBody>
                    <CardFooter className="absolute bg-black/80 bottom-0 z-10 w-full p-4 flex justify-between items-center">
                      <div className="flex flex-grow gap-2 items-center">
                        <div className="flex flex-col gap-2 text-white/80">
                          <ScrollShadow hideScrollBar className="h-[200px]">
                            <p>
                              <strong>任務名稱:</strong> {task.name}
                            </p>

                            <p>
                              <strong>描述:</strong>{" "}
                              {task.description[0].description}
                            </p>

                            <p>
                              <strong>發佈時間:</strong>{" "}
                              {new Date(
                                parseInt(task.publish_date)
                              ).toLocaleString()}
                            </p>
                            <p>
                              <strong>創建者:</strong>{" "}
                              {truncateAddress(task.creator)}
                            </p>
                            <p>
                              <strong>主持人:</strong>{" "}
                              {truncateAddress(task.moderator)}
                            </p>
                            <p>
                              <strong>地區:</strong> {task.area}
                            </p>
                            <p>
                              <strong>狀態:</strong>{" "}
                              {task.is_active ? "Active" : "Inactive"}
                            </p>
                            <p>
                              <strong>資金:</strong> {parseFloat(task.fund) / FLOAT_SCALING}
                            </p>
                            <p>
                              <strong>獎勵金額:</strong> {task.reward_amount / FLOAT_SCALING}
                            </p>
                            <Link
                              isExternal
                              href={`https://suiscan.xyz/devnet/object/${task.id}`}
                              showAnchorIcon
                            >
                              在區塊鏈上查看
                            </Link>
                          </ScrollShadow>
                          <Button
                            onPress={() => handleModifyTask(task)}
                            radius="full"
                            size="sm"
                          >
                            修改任務詳情
                          </Button>
                          <Button
                            onPress={() => handleSubmittedTask(task)}
                            radius="full"
                            size="sm"
                          >
                            管理已提交任務
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </Tab>
            <Tab key="completedTasks" title="已完成任務">
              <div className="max-w-[1200px] gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-8 mb-10">
                {completedTasks.map((task) => (
                  <Card
                    key={task.id}
                    isFooterBlurred
                    className="h-[600px] w-[300px] "
                  >
                    {/* <CardHeader className="relative z-10 top-1 flex gap-4 items-start p-4">
                      <Chip
                        color="primary"
                        className=" text-white/80 uppercase font-bold"
                      >
                        {truncateAddress(task.id)}
                      </Chip>
                    </CardHeader> */}

                    <CardBody className="relative p-4">
                      <Image
                        removeWrapper
                        alt="Task"
                        src={task.image_url}
                        className="z-0 w-full h-50 object-cover rounded-lg"
                      />
                    </CardBody>
                    <CardFooter className="absolute bg-black/80 bottom-0 z-10 w-full p-4 flex justify-between items-center">
                      <div className="flex flex-grow gap-2 items-center">
                        <div className="flex flex-col gap-2 text-white/80">
                          <ScrollShadow hideScrollBar className="h-[250px]">
                            <p>
                              <strong>任務名稱:</strong> {task.name}
                            </p>

                            <p>
                              <strong>描述:</strong>{" "}
                              {task.description[0].description}
                            </p>

                            <p>
                              <strong>發佈時間:</strong>{" "}
                              {new Date(
                                parseInt(task.publish_date)
                              ).toLocaleString()}
                            </p>
                            <p>
                              <strong>創建者:</strong>{" "}
                              {truncateAddress(task.creator)}
                            </p>
                            <p>
                              <strong>主持人:</strong>{" "}
                              {truncateAddress(task.moderator)}
                            </p>
                            <p>
                              <strong>地區:</strong> {task.area}
                            </p>
                            <p>
                              <strong>狀態:</strong>{" "}
                              {task.is_active ? "Active" : "Inactive"}
                            </p>
                            <p>
                              <strong>資金:</strong> {parseFloat(task.fund) / FLOAT_SCALING}
                            </p>
                            <p>
                              <strong>獎勵金額:</strong> {task.reward_amount / FLOAT_SCALING}
                            </p>
                            <Link
                              isExternal
                              href={`https://suiscan.xyz/devnet/object/${task.id}`}
                              showAnchorIcon
                            >
                              在區塊鏈上查看
                            </Link>
                          </ScrollShadow>
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

      {/* Modal for publishing task */}
      <Modal
        isOpen={isOpenModal1}
        onOpenChange={onOpenChangeModal1}
        placement="top-center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {selectedTask ? "Manage Task" : "Mint a Task"}
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Reward Type"
                  value={
                    selectedTask
                      ? selectedTask.reward_type
                      : newTask.reward_type
                  }
                  onChange={(e) =>
                    selectedTask
                      ? setSelectedTask({
                          ...selectedTask,
                          reward_type: e.target.value,
                        })
                      : setNewTask({ ...newTask, reward_type: e.target.value })
                  }
                />
                <Input
                  label="Task Name"
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
                  label="Description"
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
                  label="Task Image URL"
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
                  label="Task Area"
                  value={newTask.area}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      area: e.target.value,
                    })
                  }
                />
                <Input
                  label="Task MOD"
                  value={newTask.moderator}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      moderator: e.target.value,
                    })
                  }
                />
                <Input
                  label="Task Fund"
                  value={newTask.fund}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      fund: e.target.value,
                    })
                  }
                />
                <Input
                  label="Reward Amount"
                  type="number"
                  value={newTask.reward_amount}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      reward_amount: e.target.value,
                    })
                  }
                />
                <Input
                  label="Proof of completion Image URL"
                  value={newTask.poc_img_url}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      poc_img_url: e.target.value,
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
                      : handlePublishTaskChain();
                  }}
                >
                  {selectedTask ? "Save Changes" : "Publish Task"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal
        isOpen={isOpenModal2}
        onOpenChange={onOpenChangeModal2}
        size="full"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                回報
                {selectedTask ? selectedTask.name : ""}已完成任務清單
              </ModalHeader>
              <ModalBody>
                <CheckboxGroup
                  label="Select submitted tasks"
                  defaultValue={["tasksheet 1"]}
                >
                  <Checkbox value="tasksheet 1">tasksheet 1</Checkbox>
                  <Input type="string" label="note" placeholder="審批文字" />
                  <Checkbox value="tasksheet 2">tasksheet 2</Checkbox>
                  <Input type="string" label="note" placeholder="審批文字" />
                  <Checkbox value="tasksheet 3">tasksheet 3</Checkbox>
                  <Input type="string" label="note" placeholder="審批文字" />
                  <Checkbox value="tasksheet 4">tasksheet 4</Checkbox>
                  <Input type="string" label="note" placeholder="審批文字" />
                  <Checkbox value="tasksheet 5">tasksheet 5</Checkbox>
                  <Input type="string" label="note" placeholder="審批文字" />
                </CheckboxGroup>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  駁回
                </Button>
                <Button color="primary" onPress={onClose}>
                  通過
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal
        isOpen={isOpenModal3}
        onOpenChange={onOpenChangeModal3}
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                Task Name :{selectedTask ? selectedTask.name : ""}
              </ModalHeader>
              <ModalBody>
                <p>Modify Task Desciption</p>
                <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
                  <Textarea
                    maxRows={3}
                    label="Description"
                    placeholder={`${
                      selectedTask
                        ? selectedTask.description[0].description
                        : ""
                    }`}
                  />
                </div>
                <Button onPress={onClose} onClick={handleSaveTaskDetails}>
                  Save Changes
                </Button>
                <p>Take Fund</p>
                <Input
                  type="number"
                  label="Amount"
                  placeholder={`${selectedTask ? selectedTask.fund : ""}`}
                  className="max-w-lg"
                />
                <Button onClick={handleSaveTaskDetails} onPress={onClose}>
                  Take Fund
                </Button>
                <p>Add Fund</p>
                <Input
                  type="number"
                  label="Amount"
                  placeholder={`${selectedTask ? selectedTask.fund : ""}`}
                  className="max-w-lg"
                />
                <Button onClick={handleSaveTaskDetails} onPress={onClose}>
                  Add Fund
                </Button>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal
        isOpen={isOpenModal4}
        onOpenChange={onOpenChangeModal4}
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{selectedTask ? selectedTask.name : ""}</ModalHeader>
              <ModalBody>
                <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
                  <Textarea
                    maxRows={3}
                    label="Description"
                    placeholder="Enter your description"
                  />
                </div>
                <Button onClick={handleSendTaskSheet} onPress={onClose}>
                  Submit Task sheet
                </Button>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default BasicContainer;
function setLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}
