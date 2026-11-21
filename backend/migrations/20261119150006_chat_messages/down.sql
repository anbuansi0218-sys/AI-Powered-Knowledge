IF OBJECT_ID(N'dbo.chat_messages', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.chat_messages', N'chat_id') IS NULL
        EXEC sys.sp_rename N'dbo.chat_messages.conversation_id', N'chat_id', N'COLUMN';
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'chat_messages_conversation_id_id_idx')
        EXEC sys.sp_rename N'dbo.chat_messages.chat_messages_conversation_id_id_idx', N'chat_history_chat_id_id_idx', N'INDEX';
    EXEC sys.sp_rename N'dbo.chat_messages', N'chat_history';
END;
