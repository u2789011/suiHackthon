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
import "tailwindcss/tailwind.css";
import { json } from "stream/consumers";

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
  const DEVNET_EXPLORE = "https://suiscan.xyz/devnet/tx/";

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
      showPreviousTransaction: true,
    },
  });

  console.log("userTaskSheets", userTaskSheets); //FIXME: for test only

  const { data: userTaskAdminCaps } = useSuiClientQuery("getOwnedObjects", {
    owner: walletAddress ?? "",
    filter: {
      StructType: `${PACKAGE_ID}::public_task::TaskAdminCap`,
    },
    options: {
      showType: true,
      showContent: true,
      showPreviousTransaction: true,
    },
  });

  console.log("userTaskAdminCaps", userTaskAdminCaps); //FIXME: test use only

  useEffect(() => {
    if (userTaskAdminCaps && userTaskSheets) {
    }
  }, [userTaskAdminCaps, userTaskSheets]);

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
  const [taskFund, setTaskFund] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [annotation, setAnnotation] = useState("");
  const [processedTaskSheets, setProcessedTaskSheets] = useState<TaskSheet[]>(
    []
  );

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

  async function fetchAllTaskData() {
    const apiData = await fetchAllTaskList();
    if (apiData) {
      const transformedData = transformData(apiData);
      setAllTasks(transformedData);
    }
  }

  useEffect(() => {
    fetchAllTaskData();
  }, []);

  console.log("all tasks", allTasks);

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

    setAcceptedTasks(matchedTasks);
  };

  async function fetchAcceptedTask(userTaskSheets: any): Promise<TaskSheet[]> {
    if (userTaskSheets && userTaskSheets.data) {
      const jsonString = JSON.stringify(userTaskSheets, null, 2);
      const jsonObject = JSON.parse(jsonString);

      if (Array.isArray(jsonObject.data)) {
        const usertaskSheets: TaskSheet[] = jsonObject.data
          .map((item: any) => {
            if (
              item &&
              item.data &&
              item.data.content &&
              item.data.content.fields &&
              item.data.digest // 確保存在 digest 屬性
            ) {
              return {
                data: {
                  digest: item.data.digest, // 提取 digest 屬性
                  fields: item.data.content.fields,
                },
              };
            } else {
              console.warn("Item or fields is undefined:", item);
              return null;
            }
          })
          .filter((item: TaskSheet | null) => item !== null) as TaskSheet[];

        return usertaskSheets;
        //console.log("taskSheets:", userTaskSheets); //FIXME: test use only
      }
    }
    return [];
  }

  // Data for Accepted Tasks
  useEffect(() => {
    async function loadAcceptedTasks() {
      if (userTaskSheets) {
        const userTaskSheetsData = await fetchAcceptedTask(userTaskSheets);
        setProcessedTaskSheets(userTaskSheetsData);
        handleMatchAndSetAcceptedTasks(userTaskSheetsData, allTasks);
      }
    }

    loadAcceptedTasks();
  }, [userTaskSheets, allTasks]);

  //console.log("processedTaskSheets", processedTaskSheets); //FIXME: for test use only

  // Data for Published Tasks
  useEffect(() => {
    if (allTasks.length > 0) {
      const filteredTasks = allTasks.filter(
        (task) => task.creator === walletAddress
      );
      setPublishedTasks(filteredTasks);
    }
  }, [allTasks, walletAddress]);

  // select task (for Modal use)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Accept Task
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
              const explorerUrl = `${DEVNET_EXPLORE + digest}`;
              toast.success(
                <span>
                  Transaction Sent
                  <div>
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "lightblue",
                        textDecoration: "underline",
                      }}
                    >
                      View on Blockchain
                    </a>
                  </div>
                </span>
              );
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
            fetchAllTaskData();
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

  // Publish Public Tasks
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
            const explorerUrl = `${DEVNET_EXPLORE + digest}`;
            toast.success(
              <span>
                Transaction Sent
                <div>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "lightblue", textDecoration: "underline" }}
                  >
                    View on Blockchian
                  </a>
                </div>
              </span>
            );
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

            await fetchAllTaskData();

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
  //打開回報任務完成Modal
  const handleCompleteTask = (task: Task) => {
    setSelectedTask(task);
    onOpenModal4();
    console.log("Send Task Sheet", task);
  };

  const jsonStrUserTaskSheets = JSON.stringify(userTaskSheets, null, 2);
  const jsonStrUserTaskAdminCaps = JSON.stringify(userTaskAdminCaps, null, 2);

  // submit_task_sheet
  const handleSendTaskSheet = async (selectedTaskID: string) => {
    console.log(`Send Task Sheet ${selectedTaskID}`);
    if (!account.address) return;
  
    // Get Movecall params
    try {
      if (!userTaskSheets) {
        throw new Error("UserTaskSheet is undefined");
      }
  
      const jsonObjUserTaskSheet = JSON.parse(jsonStrUserTaskSheets);
      const userTaskSheetArray = jsonObjUserTaskSheet.data;
  
      const relateTaskSheet: TaskSheet | undefined = userTaskSheetArray.find(
        (tasksheet: TaskSheetArr) => {
          //console.log("Comparing:", tasksheet.data.content.fields.main_task_id, "with", selectedTaskID);
          return tasksheet.data.content.fields.main_task_id.includes(selectedTaskID);
        }
      );
  
      if (!relateTaskSheet) {
        throw new Error("No matching TaskSheet found");
      }
      const relateTaskSheetId = relateTaskSheet.data.content.fields.id.id;
  
      // TaskAdminCap
      const jsonObjUserTaskAdminCap = JSON.parse(jsonStrUserTaskAdminCaps);
      const userTaskAdminCapArray = jsonObjUserTaskAdminCap.data;
  
      const relatedTaskAdminCap: TaskAdminCap | undefined = userTaskAdminCapArray.find(
        (item: TaskAdminCapArr) => {
          //console.log("Comparing:", item.data.previousTransaction, "with", relateTaskSheet.data.previousTransaction);
          return item.data.previousTransaction === relateTaskSheet.data.previousTransaction;
        }
      );
  
      if (!relatedTaskAdminCap) {
        throw new Error("No Matching TaskAdminCap found");
      }
      const relatedTaskAdminCapID = relatedTaskAdminCap.data.content.fields.id.id;
  
      // Movecall
      const txb = new TransactionBlock();
      console.log(selectedTask);
  
      txb.moveCall({
        target: `${PACKAGE_ID}::public_task::submit_task_sheet`,
        arguments: [
          txb.pure(relateTaskSheetId),
          txb.pure(SUI_CLOCK_OBJECT_ID),
          txb.pure(relatedTaskAdminCapID),
        ],
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
                const explorerUrl = `${DEVNET_EXPLORE + digest}`;
                toast.success(
                  <span>
                    Transaction Sent
                    <div>
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "lightblue", textDecoration: "underline" }}
                      >
                        View on Blockchain
                      </a>
                    </div>
                  </span>
                );
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
              fetchAllTaskData();
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
    } catch (error) {
      console.error("Error handling task sheet submit");
    }
  };


  // update_task_sheet_content
  const handleTaskSheetDetails = async (
    selectedTaskID: string,
    description: string,
  ) => {
    if (!account.address) return;

    try {
      if(!userTaskSheets) {
        throw new Error("UserTaskSheet is undefined");
      }

      const jsonObjUserTaskSheet = JSON.parse(jsonStrUserTaskSheets);
      const userTaskSheetArray = jsonObjUserTaskSheet.data

      const relateTaskSheet: TaskSheet | undefined = userTaskSheetArray.find(
        (tasksheet: TaskSheetArr ) => {
          //console.log("Comparing:", tasksheet.data.content.fields.main_task_id, "with", selectedTaskID);
          return tasksheet.data.content.fields.main_task_id.includes(selectedTaskID)
        }
      );

      if (!relateTaskSheet) {
        throw new Error("No matching TaskSheet found");
      }
      const relateTaskSheetId = relateTaskSheet.data.content.fields.id.id;


      // TaskAdminCap
      const jsonObjUserTaskAdminCap = JSON.parse(jsonStrUserTaskAdminCaps);
      const userTaskAdminCapArray = jsonObjUserTaskAdminCap.data;

      const relatedTaskAdminCap: TaskAdminCap | undefined = userTaskAdminCapArray.find(
        (item: TaskAdminCapArr) => {
          //console.log("Comparing:", item.data.previousTransaction, "with", relateTaskSheet.data.previousTransaction)
          return item.data.previousTransaction === relateTaskSheet.data.previousTransaction
        }
      );

      if (!relatedTaskAdminCap) {
        throw new Error("No Matching TaskAdminCap found");
      }
      const relatedTaskAdminCapID = relatedTaskAdminCap.data.content.fields.id.id;


      // Move Call Function
      const txb = new TransactionBlock();

      txb.moveCall({
        target: `${PACKAGE_ID}::public_task::update_task_sheet_content`,
        arguments: [
          txb.pure(relateTaskSheetId),
          txb.pure(description),
          txb.pure(SUI_CLOCK_OBJECT_ID),
          txb.pure(relatedTaskAdminCapID) // 使用匹配的 TaskAdminCap ID
        ],
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
                const explorerUrl = `${DEVNET_EXPLORE + digest}`;
                toast.success(
                  <span>
                    Transaction Sent
                    <div>
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "lightblue", textDecoration: "underline" }}
                      >
                        View on Blockchian
                      </a>
                    </div>
                  </span>
                );
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
              fetchAllTaskData();
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

      console.log("Task Sheet Details", selectedTaskID, description);
      setTaskSheetDescription("");

    } catch (error) {
      console.error("Error handling task sheet details", error);
    }
  };

  //打開發任務者編輯已發布任務的Modal
  const handleModifyTask = (task: Task) => {
    setSelectedTask(task);
    onOpenModal3();
    console.log(task);
  };

  //增加獎池資金 | add_task_fund<T>;
  const handleAddTaskFund = (selectedTaskID: string, fund: number) => {
    /* if (!account.address) return;
        const txb = new TransactionBlock();
        console.log(selectedTask);
        txb.moveCall({
          target: `${PACKAGE_ID}::public_task::add_task_fund`,
          arguments: [
            txb.object(
              selectedTaskId
            ),
            txb.pure(SUI_CLOCK_OBJECT_ID),
            txb.pure(fund),
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
        }*/
    if (selectedTask) {
      toast.success(`${selectedTaskID} ${"任務基金已增加"} ${fund} SUI`);
      setSelectedTask(null);
    }
  };
  //取出獎池資金 | retrieve_task_fund<T>
  const handleTakeTaskFund = (selectedTaskID: string, fund: number) => {
    /* if (!account.address) return;
        const txb = new TransactionBlock();
        console.log(selectedTask);
        txb.moveCall({
          target: `${PACKAGE_ID}::public_task::retrieve_task_fund`,
          arguments: [
            txb.object(
              selectedTaskId
            ),
            txb.pure(SUI_CLOCK_OBJECT_ID),
            txb.pure(fund),
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
        }*/
    if (selectedTask) {
      toast.success(`${selectedTaskID} ${"任務基金已提取"} ${fund} SUI`);
      setSelectedTask(null);
    }
  };
  //更新任務描述 | update_task_description<T>
  const handleTaskDescription = (
    selectedTaskID: string,
    description: string
  ) => {
    /* if (!account.address) return;
        const txb = new TransactionBlock();
        console.log(selectedTask);
        txb.moveCall({
          target: `${PACKAGE_ID}::public_task::update_task_description`,
          arguments: [
            txb.object(
              selectedTaskId
            ),
            txb.pure(SUI_CLOCK_OBJECT_ID),
            txb.pure(description),
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
        }*/
    console.log("Task Sheet Details", selectedTaskID, description);
    toast.success("Task Description Updated");
  };
  //管理已提交任務打開Modal
  const handleSubmittedTask = (task: Task) => {
    setSelectedTask(task);
    console.log("Submitted Task", task);
    onOpenModal2();
  };
  //紀錄選取了哪些任務單
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected([...selected, e.target.value]);
    } else {
      setSelected(selected.filter((item) => item !== e.target.value));
    }
  };
  //認證通過並發送獎勵 | approve_and_send_reward<T>
  const handleSubmit = (annotation: string, selectedTaskId: string) => {
    /* if (!account.address) return;
        const txb = new TransactionBlock();
        console.log(selectedTask);
        txb.moveCall({
          target: `${PACKAGE_ID}::public_task::approve_and_send_reward`,
          arguments: [
            txb.object(
              selectedTaskId
            ),
            txb.pure(SUI_CLOCK_OBJECT_ID),
            txb.pure(annotation),
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
        }*/
    console.log(selectedTaskId, selected, annotation);
    toast.success(`Task Sheet ${selected} is Approved`);
    toast.success(`Note: ${annotation}`);
    setSelected([]);
  };
  //認證不通過退回任務單 | reject_and_return_task_sheet
  const handleReject = (annotation: string, selectedTaskId: string) => {
    /* if (!account.address) return;
        const txb = new TransactionBlock();
        console.log(selectedTask);
        txb.moveCall({
          target: `${PACKAGE_ID}::public_task::reject_and_return_task_sheet`,
          arguments: [
            txb.object(
              selectedTaskId
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
        }*/
    console.log(selectedTaskId, selected, annotation);
    toast.warning(`Task Sheet ${selected} Denied`);
    toast.warning(`Note: ${annotation}`);
    setSelected([]);
  };

  return (
    <>
      {/*<Divider className="my-3"></Divider>*/}
      <div className="mx-auto pt-20">
        <Button
          onPress={onOpenModal1}
          onClick={() => setSelectedTask(null)}
          size="lg"
          className="font-serif uppercase"
          color="secondary"
        >
          Publish Task
        </Button>
      </div>
      <div className="flex justify-center p-4 font-sans">
        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Options"
            variant="bordered"
            className="min-h-1 mx-auto p-4"
          >
            <Tab key="allTasks" title="All Tasks">
              <div className="max-w-[1200px] gap-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-8 mb-10">
                {allTasks.map((task) => (
                  <Card
                    key={task.id}
                    isFooterBlurred
                    className="h-[660px] w-[320px] shadow-lg rounded-lg overflow-hidden"
                  >
                    <CardBody className="relative p-3">
                      <Image
                        removeWrapper
                        alt="Task"
                        src={task.image_url}
                        className="z-0 w-full h-50 object-cover rounded-lg"
                      />
                    </CardBody>
                    <CardFooter className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black to-transparent text-white">
                      <div className="flex flex-grow gap-2 items-center">
                        <div className="flex flex-col gap-2 text-white/80">
                          <ScrollShadow
                            hideScrollBar
                            className="max-h-[280px] overflow-y-auto"
                          >
                            <h3 className="text-lg fint-semibold">
                              {task.name}
                            </h3>
                            <p>
                              <strong>Description:</strong>{" "}
                              {task.description[0].description}
                            </p>
                            <p>
                              <strong>Published:</strong>{" "}
                              {new Date(
                                parseInt(task.publish_date)
                              ).toLocaleString()}
                            </p>
                            <p>
                              <strong>Creator:</strong>{" "}
                              {truncateAddress(task.creator)}
                            </p>
                            <p>
                              <strong>MOD:</strong>{" "}
                              {truncateAddress(task.moderator)}
                            </p>
                            <p>
                              <strong>Area:</strong> {task.area}
                            </p>
                            <p>
                              <strong>Status:</strong>{" "}
                              {task.is_active ? "Active" : "Inactive"}
                            </p>
                            <p>
                              <strong>Reward Pool:</strong>{" "}
                              {parseFloat(task.fund) / FLOAT_SCALING}
                            </p>
                            <p>
                              <strong>Reward:</strong>{" "}
                              {task.reward_amount / FLOAT_SCALING}
                            </p>
                            <Link
                              isExternal
                              href={`https://suiscan.xyz/devnet/object/${task.id}`}
                              showAnchorIcon
                            >
                              View on Blockchain
                            </Link>
                          </ScrollShadow>
                          <Button
                            isDisabled={!task.is_active}
                            onClick={() => handleAcceptTask(task)}
                            radius="full"
                            size="md"
                            className=" text-white shadow-lg mt-10"
                          >
                            Accept Task
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </Tab>
            <Tab key="acceptedTasks" title="Accepted Tasks">
              <div className="max-w-[1200px] gap-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-8 mb-10">
                {!acceptedTasks.length && (
                  <div className="flex justify-center items-center h-[660px] w-[320px] mx-auto col-span-full">
                    <Image
                      alt="voidfren"
                      src="/frens/voidfren.svg"
                      className="mb-20 w-[150px] h-[150px] object-cover rounded-lg"
                    />
                    <p className="text-white/80 text-center">
                      No accepted tasks
                    </p>
                  </div>
                )}
                {acceptedTasks.map((task) => (
                  <Card
                    key={task.id}
                    isFooterBlurred
                    className="h-[660px] w-[320px] shadow-lg rounded-lg overflow-hidden"
                  >
                    <CardBody className="relative p-3">
                      <Image
                        removeWrapper
                        alt="Task"
                        src={task.image_url}
                        className="z-0 w-full h-50 object-cover rounded-lg"
                      />
                    </CardBody>
                    <CardFooter className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black to-transparent text-white">
                      <div className="flex flex-grow gap-2 items-center">
                        <div className="flex flex-col gap-2 text-white/80">
                          <ScrollShadow
                            hideScrollBar
                            className="max-h-[280px] overflow-y-auto"
                          >
                            <p>
                              <strong>Task Name:</strong> {task.name}
                            </p>
                            <p>
                              <strong>Description:</strong>{" "}
                              {task.description[0].description}
                            </p>
                            <p>
                              <strong>Published:</strong>{" "}
                              {new Date(
                                parseInt(task.publish_date)
                              ).toLocaleString()}
                            </p>
                            <p>
                              <strong>Creator:</strong>{" "}
                              {truncateAddress(task.creator)}
                            </p>
                            <p>
                              <strong>Moderator:</strong>{" "}
                              {truncateAddress(task.moderator)}
                            </p>
                            <p>
                              <strong>Area:</strong> {task.area}
                            </p>
                            <p>
                              <strong>Status:</strong>{" "}
                              {task.is_active ? "Active" : "Inactive"}
                            </p>
                            <p>
                              <strong>Fund:</strong>{" "}
                              {parseFloat(task.fund) / FLOAT_SCALING}
                            </p>
                            <p>
                              <strong>Reward Amount:</strong>{" "}
                              {task.reward_amount / FLOAT_SCALING}
                            </p>
                            <Link
                              isExternal
                              href={`https://suiscan.xyz/devnet/object/${task.id}`}
                              showAnchorIcon
                            >
                              View on Blockchain
                            </Link>
                          </ScrollShadow>
                          <Button
                            onPress={() => handleCompleteTask(task)}
                            radius="full"
                            size="md"
                          >
                            Submit Task
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </Tab>
            <Tab key="publishedTasks" title="Published Tasks">
              <div className="max-w-[1200px] gap-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-8 mb-10">
                {!publishedTasks.length && (
                  <div className="flex justify-center items-center h-[660px] w-[320px] mx-auto col-span-full">
                    <Image
                      alt="voidfren"
                      src="/frens/voidfren.svg"
                      className="mb-20 w-[150px] h-[150px] object-cover rounded-lg"
                    />
                    <p className="text-white/80 text-center">
                      No published tasks
                    </p>
                  </div>
                )}
                {publishedTasks.map((task) => (
                  <Card
                    key={task.id}
                    isFooterBlurred
                    className="h-[700px] w-[320px] shadow-lg rounded-lg overflow-hidden"
                  >
                    <CardBody className="relative p-3">
                      <Image
                        removeWrapper
                        alt="Task"
                        src={task.image_url}
                        className="z-0 w-full h-50 object-cover rounded-lg"
                      />
                    </CardBody>
                    <CardFooter className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black to-transparent text-white">
                      <div className="flex flex-grow gap-2 items-center">
                        <div className="flex flex-col gap-2 text-white/80">
                          <ScrollShadow
                            hideScrollBar
                            className="max-h-[280px] overflow-y-auto"
                          >
                            <h3 className="text-lg fint-semibold">
                              {task.name}
                            </h3>
                            <p>
                              <strong>Description:</strong>{" "}
                              {task.description[0].description}
                            </p>
                            <p>
                              <strong>Published:</strong>{" "}
                              {new Date(
                                parseInt(task.publish_date)
                              ).toLocaleString()}
                            </p>
                            <p>
                              <strong>Creator:</strong>{" "}
                              {truncateAddress(task.creator)}
                            </p>
                            <p>
                              <strong>MOD:</strong>{" "}
                              {truncateAddress(task.moderator)}
                            </p>
                            <p>
                              <strong>Area:</strong> {task.area}
                            </p>
                            <p>
                              <strong>Status:</strong>{" "}
                              {task.is_active ? "Active" : "Inactive"}
                            </p>
                            <p>
                              <strong>Reward Pool:</strong>{" "}
                              {parseFloat(task.fund) / FLOAT_SCALING}
                            </p>
                            <p>
                              <strong>Reward:</strong>{" "}
                              {task.reward_amount / FLOAT_SCALING}
                            </p>
                            <Link
                              isExternal
                              href={`https://suiscan.xyz/devnet/object/${task.id}`}
                              showAnchorIcon
                            >
                              View on Blockchain
                            </Link>
                          </ScrollShadow>
                          <Button
                            onPress={() => handleModifyTask(task)}
                            radius="full"
                            size="md"
                          >
                            Manage Your Task
                          </Button>
                          <Button
                            onPress={() => handleSubmittedTask(task)}
                            radius="full"
                            size="md"
                          >
                            View Submitted Tasks
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </Tab>
            <Tab key="completedTasks" title="Completed Tasks">
              <div className="max-w-[1200px] gap-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-8 mb-10">
                {!completedTasks.length && (
                  <div className="flex justify-center items-center h-[660px] w-[320px] mx-auto col-span-full">
                    <Image
                      alt="voidfren"
                      src="/frens/voidfren.svg"
                      className="mb-20 w-[150px] h-[150px] object-cover rounded-lg"
                    />
                    <p className="text-white/80 text-center">
                      No Completed Tasks
                    </p>
                  </div>
                )}
                {completedTasks.map((task) => (
                  <Card
                    key={task.id}
                    isFooterBlurred
                    className="h-[660px] w-[320px] shadow-lg rounded-lg overflow-hidden"
                  >
                    <CardBody className="relative p-3">
                      <Image
                        removeWrapper
                        alt="Task"
                        src={task.image_url}
                        className="z-0 w-full h-50 object-cover rounded-lg"
                      />
                    </CardBody>
                    <CardFooter className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black to-transparent text-white">
                      <div className="flex flex-grow gap-2 items-center">
                        <div className="flex flex-col gap-2 text-white/80">
                          <ScrollShadow
                            hideScrollBar
                            className="max-h-[280px] overflow-y-auto"
                          >
                            <h3 className="text-lg fint-semibold">
                              {task.name}
                            </h3>
                            <p>
                              <strong>Description:</strong>{" "}
                              {task.description[0].description}
                            </p>
                            <p>
                              <strong>Published:</strong>{" "}
                              {new Date(
                                parseInt(task.publish_date)
                              ).toLocaleString()}
                            </p>
                            <p>
                              <strong>Creator:</strong>{" "}
                              {truncateAddress(task.creator)}
                            </p>
                            <p>
                              <strong>MOD:</strong>{" "}
                              {truncateAddress(task.moderator)}
                            </p>
                            <p>
                              <strong>Area:</strong> {task.area}
                            </p>
                            <p>
                              <strong>Status:</strong>{" "}
                              {task.is_active ? "Active" : "Inactive"}
                            </p>
                            <p>
                              <strong>Reward Pool:</strong>{" "}
                              {parseFloat(task.fund) / FLOAT_SCALING}
                            </p>
                            <p>
                              <strong>Reward:</strong>{" "}
                              {task.reward_amount / FLOAT_SCALING}
                            </p>
                            <Link
                              isExternal
                              href={`https://suiscan.xyz/devnet/object/${task.id}`}
                              showAnchorIcon
                            >
                              View on Blockchain
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
      {/* Modal for Task MOD*/}
      <Modal
        isOpen={isOpenModal2}
        onOpenChange={onOpenChangeModal2}
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
              Submissions for {selectedTask ? selectedTask.name : ""}
              </ModalHeader>
              <ModalBody>
                {/* //TODO: 這裡要抓到selectedTask中的任務單們 */}
                {selectedTask?.task_sheets?.map((taskSheet, index) => (
                  <Checkbox
                    key={index}
                    value={taskSheet}
                    onChange={handleChange}
                  >
                    {taskSheet}
                  </Checkbox>
                ))}
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
                <Textarea
                  maxRows={3}
                  label="Annotation"
                  placeholder="Enter your annotation"
                  onChange={(e) => {
                    setAnnotation(e.target.value);
                  }}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={onClose}
                  onClick={() =>
                    handleReject(
                      annotation,
                      selectedTask ? selectedTask.id : ""
                    )
                  }
                >
                  駁回
                </Button>
                <Button
                  color="primary"
                  onPress={onClose}
                  onClick={() =>
                    handleSubmit(
                      annotation,
                      selectedTask ? selectedTask.id : ""
                    )
                  }
                >
                  通過
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* //modal for 修改任務單內容 & 提取任務基金 & 增加任務基金 */}
      <Modal
        isOpen={isOpenModal3}
        onOpenChange={onOpenChangeModal3}
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {selectedTask ? selectedTask.name : ""}
              </ModalHeader>
              <ModalBody>
                <p>Edit Task Description</p>
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
                  placeholder={`${selectedTask ? selectedTask.fund : 0}`}
                  className="max-w-lg"
                  onChange={(e) => {
                    setTaskFund(Number(e.target.value));
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
                  placeholder={`${selectedTask ? selectedTask.fund : 0}`}
                  className="max-w-lg"
                  onChange={(e) => {
                    setTaskFund(Number(e.target.value));
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
      {/* //Modal for 更新任務單內容 & 提交任務單  */}
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
                    minRows={80}
                    label="Task Record"
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
                    handleTaskSheetDetails(
                      selectedTask ? selectedTask.id : "",
                      taskSheetDescription
                    )
                  }
                  onPress={onClose}
                >
                  Update
                </Button>
                <Button
                  color="primary"
                  onClick={() =>
                    handleSendTaskSheet(selectedTask ? selectedTask.id : "")
                  }
                  onPress={onClose}
                >
                  Submit
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
