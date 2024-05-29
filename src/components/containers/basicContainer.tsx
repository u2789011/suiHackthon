import BasicDataField from "../fields/basicDataField";
// import BasicInputField from "../fields/basicInputField";
// import ActionButton from "../buttons/actionButton";
import { useContext, useEffect, useMemo, useState, ChangeEvent } from "react";
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
  user,
} from "@nextui-org/react";
import { log } from "console";

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

  // version 20240527
  const PACKAGE_ID =
    "0x2e9fe44a82ef679c0d2328ce71b31ad5be9669f649b154441fe01f096344c000";
  const TASK_MANAGER_ID =
    "0x2dc234a74eaf194314ec3641583bed3e61738048327d4c029ae0ca9b9920d779";
  const FLOAT_SCALING = 1000000000;

  const { walletAddress, suiName } = useContext(AppContext);
  const { data: suiBalance, refetch } = useSuiClientQuery("getBalance", {
    owner: walletAddress ?? "",
  });
  const { data: allCoins } = useSuiClientQuery("getAllCoins", {
    owner: walletAddress ?? "",
  });
  // Get TaskSheets Owned By User
  const { data: userTaskSheets } = useSuiClientQuery("getOwnedObjects", {
    owner: walletAddress ?? "",
    filter: {
      StructType: `${PACKAGE_ID}::public_task::TaskSheet`,
    },
    options: {
      showType: true,
      showContent: true,
    },
  });

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
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [taskDescription, setTaskDescription] = useState("");
  const [taskSheetDescription, setTaskSheetDescription] = useState("");
  const [taskFund, setTaskFund] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  // Get ObjectIDS in TaskManager
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

      return publishedTaskIdsArr;
    } catch (error) {
      console.error("Error fetching or converting task manager object:", error);
      return [];
    }
  }

  // Get objects data for eash intem in `publishedTaskIdsArr`
  async function fetchAllTaskList() {
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

      //console.log(userTaskSheets); //FIXME: Test Use Only
      //console.log(allCoins); //FIXME: Test Use Only
      return objectsResponse;
    } catch (error) {
      console.error("Error fetching multiple objects:", error);
      return null;
    }
  }

  // Apply Onchain object Data to ts Type structure, and set as PublishedTasks
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
        publish_date: fields.publish_date.toString(),
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
    const apiData = await fetchAllTaskList();
    if (apiData) {
      const transformedData = transformData(apiData);
      setAllTasks(transformedData);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Set Accepted Tasks Data From Task Sheets Owned by User
  const handleMatchAndSetAcceptedTasks = (
    userTaskSheets: TaskSheet[],
    allTasks: Task[]
  ) => {
    const matchedTasks: Task[] = [];
    const seenTaskIds = new Set<String>();

    userTaskSheets.forEach((taskSheet) => {
      if (taskSheet.data && taskSheet.data.fields) {
        const mainTaskId = taskSheet.data.fields.main_task_id;
        const matchedTask = allTasks.find((task) => task.id === mainTaskId);
        if (matchedTask && !seenTaskIds.has(matchedTask.id)) {
          matchedTasks.push(matchedTask);
          seenTaskIds.add(matchedTask.id);
        }
      } else {
        console.warn("Task sheet data or fields is undefined:", taskSheet);
      }
    });

    //console.log('matchedTasks:', matchedTasks); //FIXME: for test only
    setAcceptedTasks(matchedTasks);
    console.log("Acceptes Tasks:", acceptedTasks); //FIXME: for test only
  };

  async function fetchAcceptedTask() {
    if (userTaskSheets && userTaskSheets.data) {
      const jsonString = JSON.stringify(userTaskSheets, null, 2);
      const jsonObject = JSON.parse(jsonString);
      //console.log("jsonString:", jsonString); //FIXME: test use only

      //console.log('jsonObject maintask_id', jsonObject.data[0].content.fields.main_task_id);
      // Turn jsonObject into taskSheets (an array of TaskSheet)
      if (Array.isArray(jsonObject.data)) {
        const taskSheets: TaskSheet[] = jsonObject.data
          .map((item: any) => {
            if (
              item &&
              item.data &&
              item.data.content &&
              item.data.content.fields
            ) {
              return { data: { fields: item.data.content.fields } };
            } else {
              console.warn("Item or fields is undefined:", item);
              return null;
            }
          })
          .filter((item: TaskSheet | null) => item !== null) as TaskSheet[];

        //console.log("taskSheets:", taskSheets); //FIXME: test use only
        handleMatchAndSetAcceptedTasks(taskSheets, allTasks);
      }
    }
  }

  useEffect(() => {
    if (userTaskSheets) {
      fetchAcceptedTask();
    }
  }, [userTaskSheets, allTasks]);

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

    if (dryrunRes.effects.status.status !== "success") {
      toast.error("Something went wrong");
      return;
    }

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
            if (!created || created.length === 0) {
              throw new Error("No object created.");
            }

            const createdObject =
              created.find((obj) => obj.owner !== account.address)?.reference
                ?.objectId || created[0].reference?.objectId;

            if (!createdObject) {
              throw new Error("Created object ID is not a string.");
            }

            console.log(createdObject);

            const digest = await txb.getDigest({ client: client });
            toast.success(`Transaction Sent, ${digest}`);
            console.log(`Transaction Digest`, digest);

            const newTaskObject = {
              reward_type: newTask.reward_type,
              id: createdObject,
              version: 1,
              name: newTask.name,
              description: [
                {
                  description: newTask.description,
                  format: 0, // Default to plaintext
                  publish_time: Date.now(),
                },
              ],
              image_url: newTask.image_url,
              publish_date: SUI_CLOCK_OBJECT_ID,
              creator: account.address,
              moderator: newTask.moderator,
              area: newTask.area,
              is_active: true,
              fund: newTask.fund,
              reward_amount: parseInt(newTask.reward_amount),
              task_sheets: [],
              poc_img_url: newTask.poc_img_url,
            };

            setPublishedTasks((prevTasks) => [...prevTasks, newTaskObject]);

            await fetchData();
            setNewTask({
              reward_type: "",
              name: "",
              description: "",
              format: 0,
              image_url: "",
              area: "",
              reward_amount: "",
              poc_img_url: "",
              creator: "",
              moderator: "",
              fund: "",
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
          toast.error("Transaction Failed!");
          console.log(err);
        },
      }
    );

    console.log("New task published:", newTask);
  };

  const handleCompleteTask = (task: Task) => {
    setSelectedTask(task);
    onOpenModal4();
    console.log("Send Task Sheet", task);
  };

  const handleSendTaskSheet = async (selectedTaskID: string) => {
    // if (selectedTask) {
    //   toast.success("任務完成申請已送出!");
    //   setSelectedTask(null);
    // }
    console.log(`Send Task Sheet ${selectedTaskID}`);
    if (!account.address) return;

    const txb = new TransactionBlock();
    console.log(selectedTask);
    txb.moveCall({
      target: `${PACKAGE_ID}::public_task::submit_task_sheet`,
      arguments: [
        txb.object(
          "0x49806003f14dac78b61bbc0455aa1f437de190d66bb2cc9512c8524f47b9f70f"
        ),
        txb.pure(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: ["0x2::sui::SUI"],
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
  };

  const handleTaskSheetDetails = (
    selectedTaskID: string,
    description: string
  ) => {
    console.log("Task Sheet Details", selectedTaskID, description);
    toast.success("任務單描述已更新！");
    setTaskSheetDescription("");
  };

  const handleModifyTask = (task: Task) => {
    setSelectedTask(task);
    onOpenModal3();
    console.log(task);
  };

  const handleAddTaskFund = (selectedTaskID: string, fund: string) => {
    if (selectedTask) {
      toast.success(`${selectedTaskID} ${"任務基金已增加"} ${fund} SUI`);
      setSelectedTask(null);
    }
  };

  const handleTakeTaskFund = (selectedTaskID: string, fund: string) => {
    if (selectedTask) {
      toast.success(`${selectedTaskID} ${"任務基金已提取"} ${fund} SUI`);
      setSelectedTask(null);
    }
  };

  const handleTaskDescription = (
    selectedTaskID: string,
    description: string
  ) => {
    console.log("Task Sheet Details", selectedTaskID, description);
    toast.success("任務描述已更新！");
  };

  const handleSubmittedTask = (task: Task) => {
    setSelectedTask(task);
    console.log("Submitted Task", task);
    onOpenModal2();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected([...selected, e.target.value]);
    } else {
      setSelected(selected.filter((item) => item !== e.target.value));
    }
  };

  const handleSubmit = () => {
    console.log(selected);
    toast.success(`任務單${selected}已審核通過`);
    setSelected([]);
  };

  const handleReject = () => {
    console.log(selected);
    toast.warning(`任務單${selected}已駁回`);
    setSelected([]);
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
              <div className="max-w-[1200px] gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-8 mb-10">
                {allTasks.map((task) => (
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
                              <strong>資金:</strong>{" "}
                              {parseFloat(task.fund) / FLOAT_SCALING}
                            </p>
                            <p>
                              <strong>獎勵金額:</strong>{" "}
                              {task.reward_amount / FLOAT_SCALING}
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
                {!acceptedTasks.length && (
                  <div className="flex justify-center items-center h-[300px]">
                    <p className="text-white/80">No accepted tasks</p>
                  </div>
                )}
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
                              <strong>資金:</strong>{" "}
                              {parseFloat(task.fund) / FLOAT_SCALING}
                            </p>
                            <p>
                              <strong>獎勵金額:</strong>{" "}
                              {task.reward_amount / FLOAT_SCALING}
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
                {!publishedTasks.length && (
                  <div className="flex justify-center items-center h-[300px]">
                    <p className="text-white/80">No published tasks</p>
                  </div>
                )}
                {publishedTasks.map((task) => (
                  <Card
                    key={task.id}
                    isFooterBlurred
                    className="h-[600px] w-[300px] "
                  >
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
                              <strong>資金:</strong>{" "}
                              {parseFloat(task.fund) / FLOAT_SCALING}
                            </p>
                            <p>
                              <strong>獎勵金額:</strong>{" "}
                              {task.reward_amount / FLOAT_SCALING}
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
                {!completedTasks.length && (
                  <div className="flex justify-center items-center h-[300px]">
                    <p className="text-white/80">No completed tasks</p>
                  </div>
                )}
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
                              <strong>資金:</strong>{" "}
                              {parseFloat(task.fund) / FLOAT_SCALING}
                            </p>
                            <p>
                              <strong>獎勵金額:</strong>{" "}
                              {task.reward_amount / FLOAT_SCALING}
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
              <ModalHeader>Mint a Task</ModalHeader>
              <ModalBody>
                <Input
                  label="Reward Type"
                  value={newTask.reward_type}
                  onChange={(e) =>
                    setNewTask({ ...newTask, reward_type: e.target.value })
                  }
                />
                <Input
                  label="Task Name"
                  value={selectedTask ? selectedTask.name : newTask.name}
                  onChange={(e) =>
                    setNewTask({ ...newTask, name: e.target.value })
                  }
                />
                <Input
                  label="Description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                />
                <Input
                  label="Task Image URL"
                  value={newTask.image_url}
                  onChange={(e) =>
                    setNewTask({ ...newTask, image_url: e.target.value })
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
                    handlePublishTaskChain();
                  }}
                >
                  Publish Task
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
                <Checkbox value="tasksheet 1" onChange={handleChange}>
                  tasksheet 1
                </Checkbox>
                <Checkbox value="tasksheet 2" onChange={handleChange}>
                  tasksheet 2
                </Checkbox>
                <Checkbox value="tasksheet 3" onChange={handleChange}>
                  tasksheet 3
                </Checkbox>
                <Checkbox value="tasksheet 4" onChange={handleChange}>
                  tasksheet 4
                </Checkbox>
                <Checkbox value="tasksheet 5" onChange={handleChange}>
                  tasksheet 5
                </Checkbox>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={onClose}
                  onClick={handleReject}
                >
                  駁回
                </Button>
                <Button
                  color="primary"
                  onPress={onClose}
                  onClick={handleSubmit}
                >
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
                    onChange={(e) => {
                      setTaskDescription(e.target.value);
                    }}
                  />
                </div>
                <Button
                  onPress={onClose}
                  onClick={() => {
                    handleTaskDescription(
                      selectedTask ? selectedTask.id : "",
                      taskDescription
                    );
                  }}
                  color="primary"
                >
                  Save Changes
                </Button>
                <p>Take Fund</p>
                <Input
                  type="number"
                  label="Amount"
                  placeholder={`${selectedTask ? selectedTask.fund : ""}`}
                  className="max-w-lg"
                  onChange={(e) => {
                    setTaskFund(e.target.value);
                  }}
                />
                <Button
                  color="danger"
                  onClick={() =>
                    handleTakeTaskFund(
                      selectedTask ? selectedTask.id : "",
                      taskFund
                    )
                  }
                  onPress={onClose}
                >
                  Take Fund
                </Button>
                <p>Add Fund</p>
                <Input
                  type="number"
                  label="Amount"
                  placeholder={`${selectedTask ? selectedTask.fund : ""}`}
                  className="max-w-lg"
                  onChange={(e) => {
                    setTaskFund(e.target.value);
                  }}
                />
                <Button
                  color="success"
                  onClick={() => {
                    handleAddTaskFund(
                      selectedTask ? selectedTask.id : "",
                      taskFund
                    );
                  }}
                  onPress={onClose}
                >
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
                    value={taskSheetDescription}
                    onChange={(e) => {
                      setTaskSheetDescription(e.target.value);
                    }}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="warning"
                  onClick={() =>
                    handleSendTaskSheet(selectedTask ? selectedTask.id : "")
                  }
                  onPress={onClose}
                >
                  回報任務完成
                </Button>
                <Button
                  color="primary"
                  onClick={() =>
                    handleTaskSheetDetails(
                      selectedTask ? selectedTask.id : "",
                      taskSheetDescription
                    )
                  }
                  onPress={onClose}
                >
                  更新描述
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
function setLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}
