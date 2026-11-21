IF OBJECT_ID(N'dbo.user_login', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.users', N'password_hash') IS NULL
        ALTER TABLE [dbo].[users] ADD [password_hash] NVARCHAR(MAX) NULL;

    UPDATE users
    SET [password_hash] = login.[password_hash]
    FROM [dbo].[users] AS users
    JOIN [dbo].[user_login] AS login ON login.[id] = users.[user_login_id];

    IF EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE [name] = N'users_user_login_id_fkey'
            AND [parent_object_id] = OBJECT_ID(N'dbo.users')
    )
        ALTER TABLE [dbo].[users] DROP CONSTRAINT [users_user_login_id_fkey];

    IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE [object_id] = OBJECT_ID(N'dbo.users')
            AND [name] = N'users_user_login_id_key'
    )
        DROP INDEX [users_user_login_id_key] ON [dbo].[users];

    IF COL_LENGTH(N'dbo.users', N'user_login_id') IS NOT NULL
        ALTER TABLE [dbo].[users] DROP COLUMN [user_login_id];
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE [name] = N'users_password_hash_check'
        AND [parent_object_id] = OBJECT_ID(N'dbo.users')
)
    ALTER TABLE [dbo].[users]
    ADD CONSTRAINT [users_password_hash_check]
        CHECK ([password_hash] IS NULL OR LEN([password_hash]) > 0);

IF OBJECT_ID(N'dbo.user_login', N'U') IS NOT NULL
    DROP TABLE [dbo].[user_login];
