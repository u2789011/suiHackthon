module main_task::task_record {

    // Dependencies

    use std::string::String;
    use sui::clock::{ Self, Clock };
    use main_task::main_task::{ Task, get_task_id, get_task_mod, get_task_description };
    use main_task::task_description::{ TaskDescription };

    // Task AdminCap

    public struct TaskAdminCap has key, store {
        id: UID,
    }


    // TaskSheet

    public struct TaskSheet has key, store {
        id: UID,
        status: u8, // status field - 0: Not Submitted, 1: Pending Review, 2: Approved
        main_task_id: ID,
        task_description: TaskDescription,
        content: Option<String>,
        receipient: address,
        creator: address,
        created_time: u64,
        update_time: u64
    }

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
        let receipient = get_task_mod(main_task);

        let task_sheet = TaskSheet {
            id,
            status,
            main_task_id,
            task_description,
            content: option::none(),
            receipient,
            creator,
            created_time: clock::timestamp_ms(date),
            update_time: clock::timestamp_ms(date)
        };

        let task_admin_cap = TaskAdminCap { id: object::new(ctx) };

        // transfer task sheet to tasker
        transfer::public_transfer(task_sheet, creator);

        // transfer task admincap to tasker
        transfer::public_transfer(task_admin_cap, creator)

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

        let receipient = task_sheet.receipient;
        transfer::public_transfer(task_sheet, receipient)
    }

}