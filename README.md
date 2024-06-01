# Fren Suipport dApp 
![image](https://github.com/u2789011/suiHackthon/assets/153002627/f39d632e-60b0-4ef9-a0f4-95e6baa7699d)


**Fren Suipport** is a platform themed around the **Suifrens** NFT universe.<br/>

The primary function of this platform is to facilitate the exchange of labor and assets in the web3 world, offering a variety of features including public tasks, private tasks, charity crowdfunding, and product crowdfunding.<br/>
This project also a learning task module that uses on-chain records to retain all data, ensuring fair distribution of rewards.<br/>
<br/>
Currently, the first phase has implemented the public tasks feature.<br/>
<br/>
Fren Suipport aims to enable individuals without any web3 assets to seamlessly enter the web3 world. Without relying on centralized exchanges, users can earn their first web3 assets directly through activities such as learning, providing labor, and participating in submission competitions.

<br/>

**Links:** <br/>
Web: <https://frensuipport.vercel.app/>
<br/>
Does: <https://aa5961311s-organization.gitbook.io/fren-suipport>
<br/>
Git: <https://github.com/u2789011/suiHackthon>

Powered by Fren Suipport team.
<br/>
<br/>


## Public Tasks User Guide (Currently works on Sui Devnet)

### 0. Overview
This is the homepage for public tasks. Our public task model is designed with the following features:
- ***Striving for Transparency and Openness:*** Anyone can submit their work without needing permission. Certified works will be frozen and preserved on the chain using Sui's Freeze Object feature.
- ***On-chain Contract with Direct Bonus Distribution:*** Participants can confirm the existence of the prize before starting the task. The automatic reward distribution mechanism via smart contracts ensures the accuracy of the distributed amount.

![image](https://github.com/u2789011/suiHackthon/assets/153002627/ff7239c5-447c-41de-9164-b3413c8b4656)

### 1. Publish Task 
  - The creator needs to deposit a Coin object on the Sui chain as the funding source and set the reward amount for each piece.
  - The creator can assign a task MOD responsible for the subsequent certification of task submissions when publishing
    (currently, only one manager can be set, and you can designate yourself)
  - Field Input Guide: (We will optimize the filling method in the future; for now, please fill in manually):
    
  ![image](https://github.com/u2789011/suiHackthon/assets/153002627/814ed343-02d1-41d1-a7e8-ff7e72678d0e)
  - **Reward Type:** The currency type of the reward pool, e.g., `0x2::sui::SUI`
  - **Task Name:** The name of your task
  - **Description:** Task description text
  - **Task Image URL:** Task image
  - **Task Area:** The applicable area for the task
  - **Task MOD:** The Sui address of the designated task manager
  - **Task Fund:** The ObjectID of the reward, e.g., `0x18d942f98915a729f751df90351175311d5918f962ebc81d8b438eac0fc0e245`
  - **Reward Amount:** The reward amount for each approved submission
  - **Proof of Completion Image URL:** The image link for the completion proof NFT

### 2. Accept Task

### 3. Submit Task Sheet

### 4. Supervisor Reviews Task Sheet

### 5. Executor Receives Reward

<br/>

## Main Sui Object

### 1. Main Task
Defines task fields, task manager, etc. Only those with the publication permission object can modify the task description.

It locks a Fund, which can be any Coin, specified when creating the task.

### 2. Task Sheet
Minted by users when they accept tasks on the front end. Only users with modification rights can change the content.

After completing the task, the record to be submitted is written on the task sheet. Once edited, it can be submitted.

The task sheet will be automatically transferred to the task manager (address specified by the task publisher) by the smart contract.


## about the Team
Fren Suipport


## TODOS
### 0. General Functions
- Integrate SuiFren NFT Display
- Add Mailbox component to manage tasksheets
- Publish a Suifrens accessories collection
  - to grant different privileges and roles within the Fren Suipport world

### 1. Public Task Module
**Bugs**
- Fix Complete Tasks Listing
- Fix Submit Task Function
- Fix Edit Description Function

**Features**
- Add a switch for task status
- Add sponsored GasFee for first timers to mint TaskSheets.

### 2. Fundraising Module

### 3. Personal Task Module

### 4. Vendors Module
