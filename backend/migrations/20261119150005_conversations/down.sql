IF OBJECT_ID(N'dbo.conversations', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.conversations', N'profile_id') IS NULL
    BEGIN
        EXEC sys.sp_executesql N'ALTER TABLE [dbo].[conversations] ADD [profile_id] INT NULL;';
        EXEC sys.sp_executesql N'UPDATE [dbo].[conversations] SET [profile_id] = [user_id];';
        EXEC sys.sp_executesql N'ALTER TABLE [dbo].[conversations] ALTER COLUMN [profile_id] INT NOT NULL;';
        EXEC sys.sp_executesql N'
            ALTER TABLE [dbo].[conversations]
            ADD CONSTRAINT [chats_profile_id_fkey] FOREIGN KEY ([profile_id])
                REFERENCES [dbo].[profiles] ([id]) ON DELETE CASCADE ON UPDATE CASCADE;
        ';
        EXEC sys.sp_executesql N'
            CREATE INDEX [chats_profile_id_updated_at_idx]
            ON [dbo].[conversations] ([profile_id], [updated_at]);
        ';
    END;
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.conversations')
        AND [name] IN (N'chats_user_id_updated_at_idx', N'conversations_user_id_updated_at_idx'))
    BEGIN
        DECLARE @userIndex sysname =
            (SELECT TOP (1) [name] FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.conversations')
             AND [name] IN (N'chats_user_id_updated_at_idx', N'conversations_user_id_updated_at_idx'));
        EXEC(N'DROP INDEX ' + QUOTENAME(@userIndex) + N' ON [dbo].[conversations];');
    END;
    DECLARE @userForeignKey sysname =
        (SELECT TOP (1) [name] FROM sys.foreign_keys
         WHERE parent_object_id = OBJECT_ID(N'dbo.conversations')
           AND referenced_object_id = OBJECT_ID(N'dbo.users'));
    IF @userForeignKey IS NOT NULL
        EXEC(N'ALTER TABLE [dbo].[conversations] DROP CONSTRAINT ' + QUOTENAME(@userForeignKey) + N';');
    DECLARE @userDefault sysname =
        (SELECT TOP (1) dc.[name]
         FROM sys.default_constraints dc
         JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
         WHERE dc.parent_object_id = OBJECT_ID(N'dbo.conversations') AND c.[name] = N'user_id');
    IF @userDefault IS NOT NULL
        EXEC(N'ALTER TABLE [dbo].[conversations] DROP CONSTRAINT ' + QUOTENAME(@userDefault) + N';');
    IF COL_LENGTH(N'dbo.conversations', N'user_id') IS NOT NULL
        ALTER TABLE [dbo].[conversations] DROP COLUMN [user_id];
    EXEC sys.sp_rename N'dbo.conversations', N'chats';
END;
