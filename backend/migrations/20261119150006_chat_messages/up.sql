IF OBJECT_ID(N'dbo.chat_messages', N'U') IS NULL
BEGIN
    IF OBJECT_ID(N'dbo.chat_history', N'U') IS NOT NULL
        EXEC sys.sp_rename N'dbo.chat_history', N'chat_messages';
    ELSE
        EXEC sys.sp_executesql N'
            CREATE TABLE [dbo].[chat_messages] (
                [id] INT IDENTITY(1,1) NOT NULL,
                [conversation_id] INT NOT NULL,
                [role] NVARCHAR(20) NOT NULL,
                [content] NVARCHAR(MAX) NOT NULL,
                [sources] NVARCHAR(MAX) NULL,
                [token_count] INT NULL,
                [model_name] NVARCHAR(100) NULL,
                [response_time_ms] INT NULL,
                [created_at] DATETIME2(0) NOT NULL CONSTRAINT [chat_messages_created_at_df] DEFAULT (SYSUTCDATETIME()),
                CONSTRAINT [chat_messages_pkey] PRIMARY KEY CLUSTERED ([id]),
                CONSTRAINT [chat_messages_role_check] CHECK ([role] IN (N''user'', N''assistant'')),
                CONSTRAINT [chat_messages_conversation_id_fkey] FOREIGN KEY ([conversation_id])
                    REFERENCES [dbo].[conversations] ([id]) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT [chat_messages_token_count_check] CHECK ([token_count] IS NULL OR [token_count] >= 0),
                CONSTRAINT [chat_messages_response_time_ms_check]
                    CHECK ([response_time_ms] IS NULL OR [response_time_ms] >= 0),
                CONSTRAINT [chat_messages_content_check] CHECK (LEN(LTRIM(RTRIM([content]))) > 0),
                CONSTRAINT [chat_messages_sources_json_check] CHECK ([sources] IS NULL OR ISJSON([sources]) = 1)
            );
            CREATE INDEX [chat_messages_conversation_id_id_idx]
                ON [dbo].[chat_messages] ([conversation_id], [id]);
        ';
END;

IF COL_LENGTH(N'dbo.chat_messages', N'conversation_id') IS NULL
    EXEC sys.sp_rename N'dbo.chat_messages.chat_id', N'conversation_id', N'COLUMN';

IF COL_LENGTH(N'dbo.chat_messages', N'sources') IS NULL
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[chat_messages] ADD [sources] NVARCHAR(MAX) NULL;';

IF COL_LENGTH(N'dbo.chat_messages', N'token_count') IS NULL
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[chat_messages] ADD [token_count] INT NULL;';

IF COL_LENGTH(N'dbo.chat_messages', N'model_name') IS NULL
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[chat_messages] ADD [model_name] NVARCHAR(100) NULL;';

IF COL_LENGTH(N'dbo.chat_messages', N'response_time_ms') IS NULL
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[chat_messages] ADD [response_time_ms] INT NULL;';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'chat_messages_token_count_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[chat_messages]
        ADD CONSTRAINT [chat_messages_token_count_check] CHECK ([token_count] IS NULL OR [token_count] >= 0);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'chat_messages_response_time_ms_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[chat_messages]
        ADD CONSTRAINT [chat_messages_response_time_ms_check]
            CHECK ([response_time_ms] IS NULL OR [response_time_ms] >= 0);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'chat_messages_content_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[chat_messages]
        ADD CONSTRAINT [chat_messages_content_check]
            CHECK (LEN(LTRIM(RTRIM([content]))) > 0);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'chat_messages_sources_json_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[chat_messages]
        ADD CONSTRAINT [chat_messages_sources_json_check]
            CHECK ([sources] IS NULL OR ISJSON([sources]) = 1);
    ';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'chat_history_chat_id_id_idx')
    EXEC sys.sp_rename N'dbo.chat_messages.chat_history_chat_id_id_idx', N'chat_messages_conversation_id_id_idx', N'INDEX';
