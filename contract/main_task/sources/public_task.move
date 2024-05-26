/// Module: main_task
module main_task::public_task {

    // Dependencies

    use std::string::{ String };
    use std::vector::{ length, borrow };
    use sui::clock::{ Self, Clock };
    use sui::coin::{ Self, Coin };
    use sui::balance::Balance;
    use sui::event::emit;

    // Errors

    const ETaskIsActive: u64 = 0;
    const ETaskIsInactive: u64 = 1; 
    const EInvalidTaskSheetStatus: u64 = 2;
    const EInvalidModerator: u64 = 3;

    /*---Task Events---*/

    // Task Published Event
    public struct TaskPublished has copy, drop {
        task_id: ID,
        name: String,
        creator: address,
        timestamp: u64,
    }

    // Task Description Updated Event
    public struct TaskDescriptionUpdated has copy, drop {
        task_id: ID,
        version: u8,
        timestamp: u64
    }

    // Task Status Changed Event
    public struct TaskStatusChanged has copy, drop {
        task_id: ID,
        new_status: bool,
    }

    // Reward Fund Increased Event
    public struct RewardFundIncreasedEvent has copy, drop {
        task_id: ID,
        fund_increased: u64
    }

    // Reward Fund Decreased Event
    public struct RewardFundDecreasedEvent has copy, drop {
        task_id: ID,
        fund_decreased: u64
    }

    /*---Task Sheet Events---*/

    // Task Sheet Minted Event
    public struct TaskSheetMintedEvent has copy, drop {
        task_id: ID,
        task_sheet_id: ID,
        tasker: address,
        timestamp: u64
    }

    // Task Sheet Submitted Event
    public struct TaskSheetSubmittedEvent has copy, drop {
        task_id: ID,
        task_sheet_id: ID,
        tasker: address,
        receipient: address,
        timestamp: u64
    }

    // Task Sheet Approved Event
    public struct TaskSheetApprovedEvent has copy, drop {
        task_id: ID,
        completer: address,
        reward: u64,
        timestamp: u64
    }

    // Task Rejected Event
    public struct TaskRejectedEvent has copy, drop {
        task_sheet_id: ID,
        timestamp: u64
    }

    // Admin Cap

    public struct AdminCap has key, store {
        id: UID,
    }

    // Moderator Cap

    public struct ModCap has key, store {
        id: UID,
    }

    // Task AdminCap

    public struct TaskAdminCap has key, store {
        id: UID,
    }

    /*---Main Objects Struct---*/

    // Proof of Completion Struct

    public struct ProofOfCompletion has key, store {
        id: UID,
        task_id: ID,
        completer: address,
        image_url: String,
        issued_time: u64
    }

    // Define Task Struct

    public struct Task<phantom T> has key, store {
        id: UID,
        version: u8,
        name: String,
        description: vector<TaskDescription>,
        image_url: String,
        publish_date: u64,
        creator: address,
        moderator: address,
        area: String,
        is_active: bool, // true: active, false: inactive
        fund: Balance<T>,
        reward_amount: u64,
        task_sheets: vector<ID>,
        poc_img_url: String
    }

    //  Task Description Struct

    public struct TaskDescription has store, copy {
        description: String,
        format: u8, // 0: Plaintext, 1: Markdown
        publish_time: u64
    }

    // TaskSheet Struct

    public struct TaskSheet has key, store {
        id: UID,
        status: u8, // status field - 0: Not Submitted, 1: Pending Review, 2: Approved
        main_task_id: ID,
        task_description: TaskDescription,
        content: Option<String>,
        annotation: Option<String>,
        moderator: address,
        creator: address,
        created_time: u64,
        update_time: u64
    }

    
    /*---Main Entry Functions---*/

    // publish a task

    public entry fun publish_task<T>(
        name: String,
        text_content: String,
        format: u8,
        image_url: String,
        date: &Clock,
        area: String,
        is_active: bool,
        moderator: address,
        fund: Coin<T>,
        reward_amount: u64,
        poc_img_url: String,
        ctx: &mut TxContext
    ) {
        let fund = fund.into_balance();
        let creator = tx_context::sender(ctx);
        let input_text = create_task_description(text_content, format, date);
        let mut description_vector = vector::empty();
        vector::push_back(&mut description_vector, input_text);
        
        // create the main task object 
        let task = Task<T>{
            id: object::new(ctx),
            version: 1u8,
            name,
            description: description_vector,
            image_url,
            publish_date: clock::timestamp_ms(date),
            creator,
            moderator,
            area,
            is_active,
            fund,
            reward_amount,
            task_sheets: vector::empty(),
            poc_img_url
        };

        // create an admin_cap object
        let admin_cap = AdminCap { id: object::new(ctx) };

        // create a moderator_cap object
        let mod_cap = ModCap { id: object::new(ctx)};

        // Emit the TaskPublished event
        emit(TaskPublished {
            task_id: get_task_id(&task),
            name: task.name,
            creator: task.creator,
            timestamp: task.publish_date,
        });

        // public the task
        transfer::share_object(task);

        // transfer admin_cap to creator
        transfer::transfer(admin_cap, creator);

        // transfer mod_cap to moderator
        transfer::transfer(mod_cap, moderator);

    }


    // Task Admin Functions

    public entry fun update_task_status<T>(
        task: &mut Task<T>,
        _: &AdminCap
    ){
        task.is_active = !task.is_active;

        emit(TaskStatusChanged {
            task_id: get_task_id(task),
            new_status: task.is_active,
        });

    }

    // create task description

    fun create_task_description(
        input: String,
        format: u8,
        date: &Clock,
    ): TaskDescription {
        TaskDescription {
            description: input,
            format,
            publish_time: clock::timestamp_ms(date)
        }
    }

    // Create a New Version of Task_description

    public entry fun update_task_description<T>(
        task: &mut Task<T>,
        text_content: String,
        format: u8,
        date: &Clock,
        _: &AdminCap
    ) { 
        if (task.is_active == false){
            abort ETaskIsInactive
        };
        let new_version = create_task_description(text_content, format, date);
        vector::push_back(&mut task.description, new_version);
        task.version = task.version + 1;

        emit(TaskDescriptionUpdated {
            task_id: get_task_id(task),
            version: task.version,
            timestamp: clock::timestamp_ms(date)
        })
    }


    /*-- Reward Admin/Mod Functions --*/

    // Approve the task sheet, send the reward, and freeze it.
    public entry fun approve_and_send_reward<T>(
        task:&mut Task<T>,
        mut task_sheet: TaskSheet,
        annotation: String,
        clock: &Clock,
        _: &ModCap,
        ctx: &mut TxContext
    ) { 
        // Ensure the task status is active
        if (task.is_active == false){
            abort ETaskIsInactive
        };

        // Ensure the task sheet status is pending review (1)
        if (task_sheet.status != 1) {
            abort EInvalidTaskSheetStatus
        };
        

        // MOD add annotation
        let moderator = ctx.sender();
        add_annotation(&mut task_sheet, annotation, moderator, clock);

        // Update task sheet status to approved
        task_sheet.status = 2;
        task_sheet.update_time = clock::timestamp_ms(clock);

        // send reward to tasker
        let tasker = task_sheet.creator;
        let reward_amount = get_task_reward_amount(task);
        let reward = coin::take(&mut task.fund, reward_amount, ctx);
        transfer::public_transfer(reward, tasker);

        // Copy task_sheet id and store in task.task_sheet vector
        let task_sheet_id = get_task_sheet_id(&task_sheet);
        vector::push_back(&mut task.task_sheets, task_sheet_id);

        // freeze task_sheet to avoid any change ever happen after being approved
        transfer::public_freeze_object(task_sheet);

        // Mint Proof of Completion
        let img_url = task.poc_img_url;
        issue_proof_of_completion(task, tasker, img_url, clock, ctx);


        emit(TaskSheetApprovedEvent{
            task_id: get_task_id(task),
            completer: tasker,
            reward: reward_amount,
            timestamp: clock::timestamp_ms(clock)
        })

    }

    // Add Reject Task Sheet Submission and Return to the Creator

    public entry fun reject_and_return_task_sheet (
        mut task_sheet: TaskSheet,
        annotation: String,
        date: &Clock,
        _: &ModCap
    ){  
        let task_sheet_creator = task_sheet.creator;
        let moderator = task_sheet.moderator;
        let task_sheet_id = object::uid_to_inner(&task_sheet.id);

        // add annotaion on task sheet
        add_annotation(&mut task_sheet, annotation, moderator, date);

        // Update task sheet status
        task_sheet.status = 0;
        task_sheet.update_time = clock::timestamp_ms(date);

        emit(TaskRejectedEvent {
            task_sheet_id: task_sheet_id,
            timestamp: task_sheet.update_time
        });

        // Return the task sheet to the Creator
        transfer::public_transfer(task_sheet, task_sheet_creator);

    }

    // For Admin to Take Out the Reward Funding

    public entry fun retrieve_task_fund<T> (
        task: &mut Task<T>,
        value: u64,
        _: &AdminCap,
        ctx: &mut TxContext
    ) { 
        if (task.is_active == true){
            abort ETaskIsActive
        };
        let fund = coin::take(&mut task.fund, value, ctx);
        transfer::public_transfer(fund, task.creator);

        emit(RewardFundDecreasedEvent {
            task_id: get_task_id(task),
            fund_decreased: value
        })
    }

    // For Admin to Put More Funds Into Reward Pool

    public entry fun add_task_fund<T> (
        task: &mut Task<T>,
        add_fund: Coin<T>,
        _: &AdminCap,
    ) {
        let fund_increased = coin::value(&add_fund);
        coin::put(&mut task.fund, add_fund);

        emit(RewardFundIncreasedEvent {
            task_id: get_task_id(task),
            fund_increased: fund_increased
        })
    }

    // for MOD to add annotation on task_sheet
    fun add_annotation (
        task_sheet: &mut TaskSheet,
        annotation: String,
        moderator: address,
        date: &Clock
    ) {
        assert!(is_mod(task_sheet, moderator), EInvalidModerator);
        task_sheet.annotation = option::some(annotation);
        task_sheet.update_time = clock::timestamp_ms(date)
    }

    fun is_mod(task_sheet: &TaskSheet, address: address): bool {
        task_sheet.moderator == address
    }


    // issue proof of completion and transfer to completer
    fun issue_proof_of_completion<T> (
        task: &Task<T>,
        completer: address,
        image_url: String,
        date: &Clock,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        let issued_time = clock::timestamp_ms(date);
        let task_id = object::uid_to_inner(&task.id);

        let proof_of_completion = ProofOfCompletion {
            id,
            task_id,
            completer,
            image_url,
            issued_time
        };

        transfer::public_transfer(proof_of_completion, completer)

    }


    /*-- Tasker/Tasksheets functions --*/


    // Mint Task Sheet By Tasker

    public entry fun mint_task_sheet<T>(
        main_task: &mut Task<T>,
        date: &Clock,
        ctx: &mut TxContext
    ){
        let id = object::new(ctx);
        let status = 0u8;
        let main_task_id = get_task_id(main_task);
        let task_description = get_task_description(main_task);
        let creator = ctx.sender();
        let moderator = get_task_mod(main_task);

        let task_sheet = TaskSheet {
            id,
            status,
            main_task_id,
            task_description,
            content: option::none(),
            annotation: option::none(),
            moderator,
            creator,
            created_time: clock::timestamp_ms(date),
            update_time: clock::timestamp_ms(date)
        };

        let task_admin_cap = TaskAdminCap { id: object::new(ctx) };
        let task_sheet_id = &task_sheet.id;

        emit(TaskSheetMintedEvent {
            task_id: get_task_id(main_task),
            task_sheet_id: object::uid_to_inner(task_sheet_id),
            tasker: creator,
            timestamp: clock::timestamp_ms(date)
        });

        // transfer task sheet to tasker
        transfer::public_transfer(task_sheet, creator);

        // transfer task admincap to tasker
        transfer::public_transfer(task_admin_cap, creator);

    }

        // Modify Content On Task Sheet

    public entry fun update_task_sheet_content (
        task_sheet: &mut TaskSheet,
        content: String,
        update_time: &Clock,
        _: &TaskAdminCap
        ) {
            let update_time = clock::timestamp_ms(update_time);
            task_sheet.content = option::some(content);
            task_sheet.update_time = update_time
        }


    // Submit TaskSheet to Mod

    public entry fun submit_task_sheet (
        mut task_sheet: TaskSheet,
        date: &Clock,
        _: &TaskAdminCap
    ) {
        task_sheet.update_time = clock::timestamp_ms(date);
        task_sheet.status = 1u8;

        let task_id = task_sheet.main_task_id;
        let receipient = task_sheet.moderator;
        let tasker = task_sheet.creator;
        let task_sheet_id = object::uid_to_inner(&task_sheet.id);

        emit(TaskSheetSubmittedEvent {
            task_id,
            task_sheet_id,
            tasker,
            receipient,
            timestamp: clock::timestamp_ms(date)
        });

        transfer::public_transfer(task_sheet, receipient);

    }


    // Getter functions
    
    fun get_task_reward_amount<T> (
        task: &Task<T>
    ): u64 {
        task.reward_amount
    }

    fun get_task_id<T> (
        task: &Task<T>,
    ): ID {
        object::uid_to_inner(&task.id)
    }

    fun get_task_mod<T> (
        task: &Task<T>,
    ): address {
        task.moderator
    }

    fun get_task_description<T> (
        task: &Task<T>,
    ): TaskDescription {
        let i = length(&task.description) - 1;
        *borrow(&task.description, i)
    }

    fun get_task_sheet_id (
        task_sheet: &TaskSheet,
    ): ID {
        object::uid_to_inner(&task_sheet.id)
    }
    

}

