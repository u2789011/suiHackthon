import { checkWalletConnection } from './transactionUtils';
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui.js/utils";
import { toast } from "react-toastify";
import { showToast } from "../components/ui/linkToast"
import {
    useAccounts,
    useSignAndExecuteTransactionBlock,
    useSuiClient,
  } from "@mysten/dapp-kit";

const { mutate: signAndExecuteTransactionBlock } =
  useSignAndExecuteTransactionBlock();
const client = useSuiClient();
const FLOAT_SCALING = 1000000000;
const DEVNET_EXPLORE = "https://suiscan.xyz/devnet/tx/";
const PACKAGE_ID =
    //"0x2e9fe44a82ef679c0d2328ce71b31ad5be9669f649b154441fe01f096344c000";
    //"0xafb7c825ba78477cb42702a896eb1c8f758e5f4d9ff972f0f868b782f2623728";
    "0xd84bf8f814a797c2e04a31dba8d4ba276489dc835e6b3ee725059a756b0cfe14";
    //"0xecf2634415b80825ed7c8eb0665d72634a724c20fdfecc2829d342cc919a4bc3";
const TASK_MANAGER_ID =
    //"0x2dc234a74eaf194314ec3641583bed3e61738048327d4c029ae0ca9b9920d779";
    //"0x3344e431011bb803c69db2d5291f8b820434b0ce03c0d092edfc54f0ae2e0e7b";
    "0x8a1f4de7e060da0fd3e14839c7c9e8250895061c1f39f0bacf90c9b7744a78a2";
    //"0xbd611efa720db9f59e49f0619b4bd03edfb6ad157cd85520f8caf341b98315c0";



// Publish Public Tasks 
export const handlePublishTaskChain = async (
    newTask: any,
    account: any,
    setPublishedTasks: React.Dispatch<React.SetStateAction<any[]>>,
    setNewTask: React.Dispatch<React.SetStateAction<any>>
) => {
    if (!checkWalletConnection(account)) return;

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
                    const created = res.effects?.created;
                    if (!created || created.length === 0) {
                        throw new Error("No object created.");
                    }

                    const createdObject = created.find((obj) => obj.owner !== account.address)?.reference
                        ?.objectId || created[0].reference?.objectId;

                    if (!createdObject) {
                        throw new Error("Created object ID is not a string.");
                    }

                    console.log(createdObject);

                    const digest = await txb.getDigest({ client: client });
                    const explorerUrl = `${DEVNET_EXPLORE + digest}`;
                    showToast("Task Published", explorerUrl);
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
                        previousTransaction: ""
                    };

                    setPublishedTasks((prevTasks) => [...prevTasks, newTaskObject]);

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
                /* FIXME: import refetch
                refetch();
                fetchAllTaskData();
                await loadAcceptedTasks();
                */
            },
            onError: (err) => {
                toast.error("Transaction Failed!");
                console.log(err);
            },
        }
    );

    console.log("New task published:", newTask);
  };