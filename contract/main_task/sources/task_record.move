module main_task::task_record {

    // Dependencies

    use std::string::String;
    use sui::clock::{ Self, Clock };
    use main_task::main_task::{ Task, get_task_id, get_task_mod };

    // TaskSheet

    public struct TaskSheet has key, store {
        id: UID,
        main_task_id: ID,
        // TODO: add default task content
        content: String,
        receipient: address,
        creator: address,
        created_time: u64,
        // TODO: add update-time
    }

    // Mint Task Sheet By Tasker

    public entry fun mint_task_sheet<T>(
        content: String,
        main_task: &mut Task<T>,
        date: &Clock,
        ctx: &mut TxContext
    ){
        let id = object::new(ctx);
        let main_task_id = get_task_id(main_task);
        let creator = ctx.sender();
        let receipient = get_task_mod(main_task);

        let task_sheet = TaskSheet {
            id,
            main_task_id,
            // TODO: add default task content
            content,
            receipient,
            creator,
            created_time: clock::timestamp_ms(date)
            // TODO: add update-time
            // TODO: admin_cap
        };

        // transfer task sheet to tasker
        transfer::public_transfer(task_sheet, creator)

    }


    // Modify Content On Task Sheet

    public entry fun update_task_sheet_content (
        task_sheet: &mut TaskSheet,
        content: String,
        update_time: &Clock
    ) {
        let update_time = clock::timestamp_ms(update_time);
        task_sheet.content = content;
        task_sheet.created_time = update_time // TODO: change to  update-time
    }


    // Submit TaskSheet to Mod

    public entry fun submit_task_sheet (
        task_sheet: TaskSheet,
    ) {
        let receipient = task_sheet.receipient;
        transfer::public_transfer(task_sheet, receipient)
    }


}