IF OBJECT_ID(N'dbo.conversations', N'U') IS NULL
BEGIN
    IF OBJECT_ID(N'dbo.chats', N'U') IS NOT NULL
        EXEC sys.sp_rename N'dbo.chats', N'conversations';
    ELSE
        EXEC sys.sp_executesql N'
            CREATE TABLE [dbo].[conversations] (
                [id] INT IDENTITY(1,1) NOT NULL,
                [user_id] INT NOT NULL CONSTRAINT [conversations_user_id_df] DEFAULT (1),
                [title] NVARCHAR(255) NOT NULL CONSTRAINT [conversations_title_df] DEFAULT (N''New conversation''),
                [created_at] DATETIME2(0) NOT NULL CONSTRAINT [conversations_created_at_df] DEFAULT (SYSUTCDATETIME()),
                [updated_at] DATETIME2(0) NOT NULL CONSTRAINT [conversations_updated_at_df] DEFAULT (SYSUTCDATETIME()),
                CONSTRAINT [conversations_pkey] PRIMARY KEY CLUSTERED ([id]),
                CONSTRAINT [conversations_user_id_fkey] FOREIGN KEY ([user_id])
                    REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT [conversations_title_check] CHECK (LEN(LTRIM(RTRIM([title]))) > 0)
            );
        ';
END;

IF COL_LENGTH(N'dbo.conversations', N'user_id') IS NULL
BEGIN
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[conversations] ADD [user_id] INT NULL;';
    EXEC sys.sp_executesql N'
        UPDATE [dbo].[conversations]
        SET [user_id] = [profile_id]
        WHERE [user_id] IS NULL;
    ';
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[conversations] ALTER COLUMN [user_id] INT NOT NULL;';
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.conversations') AND c.[name] = N'user_id'
)
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[conversations]
        ADD CONSTRAINT [conversations_user_id_df] DEFAULT (1) FOR [user_id];
    ';

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID(N'dbo.conversations')
        AND referenced_object_id = OBJECT_ID(N'dbo.users')
)
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[conversations]
        ADD CONSTRAINT [conversations_user_id_fkey] FOREIGN KEY ([user_id])
            REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE ON UPDATE CASCADE;
    ';

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'chats_profile_id_fkey')
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[conversations] DROP CONSTRAINT [chats_profile_id_fkey];';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'chats_profile_id_updated_at_idx')
    EXEC sys.sp_executesql N'DROP INDEX [chats_profile_id_updated_at_idx] ON [dbo].[conversations];';

IF COL_LENGTH(N'dbo.conversations', N'profile_id') IS NOT NULL
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[conversations] DROP COLUMN [profile_id];';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'conversations_title_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[conversations]
        ADD CONSTRAINT [conversations_title_check] CHECK (LEN(LTRIM(RTRIM([title]))) > 0);
    ';

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.conversations')
        AND [name] IN (N'chats_user_id_updated_at_idx', N'conversations_user_id_updated_at_idx')
)
    EXEC sys.sp_executesql N'
        CREATE INDEX [conversations_user_id_updated_at_idx]
        ON [dbo].[conversations] ([user_id], [updated_at]);
    ';
