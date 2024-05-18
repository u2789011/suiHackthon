module main_task::task_description {

    use std::string::String;

    public struct TaskDescription has store, copy {
        description: String,
        format: u8 // 0=Plain text, 1=Markdown
    }


    public(package) fun create_task_description(
        input: String,
        format: u8
    ): TaskDescription {
        TaskDescription {
            description: input,
            format,
        }
    }


}