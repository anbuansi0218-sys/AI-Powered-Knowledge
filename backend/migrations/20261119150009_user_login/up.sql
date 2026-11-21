IF OBJECT_ID(N'dbo.user_login', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[user_login] (
        [id] INT IDENTITY(1,1) NOT NULL,
        [password_hash] NVARCHAR(MAX) NOT NULL,
        [created_at] DATETIME2(0) NOT NULL
            CONSTRAINT [user_login_created_at_df] DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT [user_login_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [user_login_password_hash_check]
            CHECK (LEN([password_hash]) > 0)
    );
END;

IF COL_LENGTH(N'dbo.users', N'user_login_id') IS NULL
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[users] ADD [user_login_id] INT NULL;';

IF COL_LENGTH(N'dbo.users', N'password_hash') IS NOT NULL
    EXEC sys.sp_executesql N'
        DECLARE @LoginMap TABLE (
            [user_id] INT NOT NULL,
            [user_login_id] INT NOT NULL
        );

        MERGE [dbo].[user_login] AS target
        USING (
            SELECT [id] AS [user_id], [password_hash]
            FROM [dbo].[users]
            WHERE [password_hash] IS NOT NULL AND [user_login_id] IS NULL
        ) AS source
        ON 1 = 0
        WHEN NOT MATCHED THEN
            INSERT ([password_hash]) VALUES (source.[password_hash])
        OUTPUT source.[user_id], inserted.[id]
            INTO @LoginMap ([user_id], [user_login_id]);

        UPDATE users
        SET [user_login_id] = loginMap.[user_login_id]
        FROM [dbo].[users] AS users
        JOIN @LoginMap AS loginMap ON loginMap.[user_id] = users.[id];
    ';

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE [object_id] = OBJECT_ID(N'dbo.users')
        AND [name] = N'users_user_login_id_key'
)
    EXEC sys.sp_executesql N'
        CREATE UNIQUE INDEX [users_user_login_id_key]
        ON [dbo].[users] ([user_login_id])
        WHERE [user_login_id] IS NOT NULL;
    ';

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE [name] = N'users_user_login_id_fkey'
        AND [parent_object_id] = OBJECT_ID(N'dbo.users')
)
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[users]
        ADD CONSTRAINT [users_user_login_id_fkey]
            FOREIGN KEY ([user_login_id]) REFERENCES [dbo].[user_login] ([id]);
    ';

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE [name] = N'users_password_hash_check'
        AND [parent_object_id] = OBJECT_ID(N'dbo.users')
)
    ALTER TABLE [dbo].[users] DROP CONSTRAINT [users_password_hash_check];

IF COL_LENGTH(N'dbo.users', N'password_hash') IS NOT NULL
    ALTER TABLE [dbo].[users] DROP COLUMN [password_hash];
