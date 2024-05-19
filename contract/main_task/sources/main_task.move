/// Module: main_task
module main_task::main_task {

    // Dependencies

    use std::string::{ String };
    use std::vector::{ length, borrow };
    use sui::clock::{ Self, Clock };
    use main_task::task_description::{create_task_description, TaskDescription};
    use sui::coin::{Self, Coin};
    use sui::balance::Balance;

    // Errors

    const ETaskIsActive: u64 = 2;
    const ETaskIsInactive: u64 = 3; 

    // Admin Cap

    public struct AdminCap has key, store {
        id: UID,
    }

    // Moderator Cap

    public struct ModCap has key, store {
        id: UID,
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
        reward_amount: u64
    }

    
    // publish a task

    public entry fun publish_task<T>(
        name: String,
        text_content: String,
        format: u8,
        image_url: String,
        date: &Clock,
        area: String,
        //_is_active: bool, FIXME: test only
        moderator: address,
        fund: Coin<T>,
        reward_amount: u64,
        ctx: &mut TxContext
    ) {
        let is_active = true; //FIXME: test only
        let fund = fund.into_balance();
        let creator = tx_context::sender(ctx);
        let input_text = create_task_description(text_content, format);
        let mut description_vector = vector::empty();
        vector::push_back(&mut description_vector, input_text);
        
        // create the main task object 
        let task = Task<T>{
            id: object::new(ctx),
            version: 1,
            name,
            description: description_vector,
            image_url,
            publish_date: clock::timestamp_ms(date),
            creator,
            moderator,
            area,
            is_active,
            fund,
            reward_amount
        };

        // create an admin_cap object
        let admin_cap = AdminCap { id: object::new(ctx) };

        // create a moderator_cap object
        let mod_cap = ModCap { id: object::new(ctx)};

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
        task.is_active = !task.is_active
    }


    // Create a New Version of Task_description

    public entry fun update_task_description<T>(
        task: &mut Task<T>,
        text_content: String,
        format: u8,
        _: &AdminCap
    ) { 
        if (task.is_active == false){
            abort ETaskIsInactive
        };
        let new_version = create_task_description(text_content, format);
        vector::push_back(&mut task.description, new_version);
        task.version = task.version + 1
    }


    /*-- Reward Admin/Mod Functions --*/

    // TODO: should be a non-entry fun, &task should be changed

    public entry fun send_reward<T>(
        task:&mut Task<T>,
        tasker: address,
        _: &ModCap,
        ctx: &mut TxContext
    ) { 
        if (task.is_active == false){
            abort ETaskIsInactive
        };
        let reward_amount = get_task_reward_amount(task);
        let reward = coin::take(&mut task.fund, reward_amount, ctx);
        transfer::public_transfer(reward, tasker)
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
        transfer::public_transfer(fund, task.creator)
    }

    // For Admin to Put More Funds Into Reward Pool

    public entry fun add_task_fund<T> (
        task: &mut Task<T>,
        add_fund: Coin<T>,
        _: &AdminCap,
    ) {
        coin::put(&mut task.fund, add_fund);
    }


    // Getter functions
    
    public(package) fun get_task_reward_amount<T>(
        task: &Task<T>
    ): u64 {
        task.reward_amount
    }

    public(package) fun get_task_id<T>(
        task: &Task<T>,
    ): ID {
        object::uid_to_inner(&task.id)
    }

    public(package) fun get_task_mod<T>(
        task: &Task<T>,
    ): address {
        task.moderator
    }

    
    public(package) fun get_task_description<T> (
        task: &Task<T>,
    ): TaskDescription {
        let i = length(&task.description) - 1;
        *borrow(&task.description, i)
    }
    

}

