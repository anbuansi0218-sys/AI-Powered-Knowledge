IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[users] (
        [id] INT IDENTITY(1,1) NOT NULL,
        [name] NVARCHAR(100) NOT NULL,
        [email] NVARCHAR(150) NOT NULL,
        [password_hash] NVARCHAR(MAX) NULL,
        [role] NVARCHAR(30) NOT NULL CONSTRAINT [users_role_df] DEFAULT (N'user'),
        [is_active] BIT NOT NULL CONSTRAINT [users_is_active_df] DEFAULT (1),
        [chat_model] NVARCHAR(120) NOT NULL CONSTRAINT [users_chat_model_df] DEFAULT (N'qwen-plus'),
        [temperature] FLOAT NOT NULL CONSTRAINT [users_temperature_df] DEFAULT (0.2),
        [created_at] DATETIME2(0) NOT NULL CONSTRAINT [users_created_at_df] DEFAULT (SYSUTCDATETIME()),
        [updated_at] DATETIME2(0) NOT NULL CONSTRAINT [users_updated_at_df] DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [users_email_key] UNIQUE ([email]),
        CONSTRAINT [users_role_check] CHECK ([role] IN (N'admin', N'user')),
        CONSTRAINT [users_temperature_check] CHECK ([temperature] BETWEEN 0 AND 2),
        CONSTRAINT [users_name_check] CHECK (LEN(LTRIM(RTRIM([name]))) > 0),
        CONSTRAINT [users_email_check] CHECK ([email] LIKE N'%_@_%._%'),
        CONSTRAINT [users_password_hash_check] CHECK ([password_hash] IS NULL OR LEN([password_hash]) > 0)
    );
END;

IF COL_LENGTH(N'dbo.users', N'chat_model') IS NULL
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[users]
        ADD [chat_model] NVARCHAR(120) NOT NULL
            CONSTRAINT [users_chat_model_df] DEFAULT (N''qwen-plus'');
    ';

IF COL_LENGTH(N'dbo.users', N'temperature') IS NULL
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[users]
        ADD [temperature] FLOAT NOT NULL CONSTRAINT [users_temperature_df] DEFAULT (0.2);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'users_temperature_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[users]
        ADD CONSTRAINT [users_temperature_check] CHECK ([temperature] BETWEEN 0 AND 2);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'users_name_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[users]
        ADD CONSTRAINT [users_name_check] CHECK (LEN(LTRIM(RTRIM([name]))) > 0);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'users_email_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[users]
        ADD CONSTRAINT [users_email_check] CHECK ([email] LIKE N''%_@_%._%'');
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'users_password_hash_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[users]
        ADD CONSTRAINT [users_password_hash_check]
            CHECK ([password_hash] IS NULL OR LEN([password_hash]) > 0);
    ';

IF OBJECT_ID(N'dbo.profiles', N'U') IS NOT NULL
BEGIN
    EXEC sys.sp_executesql N'
        SET IDENTITY_INSERT [dbo].[users] ON;
        INSERT INTO [dbo].[users]
            ([id], [name], [email], [role], [chat_model], [temperature], [created_at], [updated_at])
        SELECT
            p.[id], LEFT(p.[profile_name], 100),
            CONCAT(N''profile-'', p.[id], N''@localhost.invalid''),
            N''user'', p.[chat_model], p.[temperature], p.[created_at], p.[updated_at]
        FROM [dbo].[profiles] p
        WHERE NOT EXISTS (SELECT 1 FROM [dbo].[users] u WHERE u.[id] = p.[id]);
        SET IDENTITY_INSERT [dbo].[users] OFF;

        UPDATE u
        SET [chat_model] = p.[chat_model],
            [temperature] = p.[temperature]
        FROM [dbo].[users] u
        JOIN [dbo].[profiles] p ON p.[id] = u.[id];
    ';
END;

EXEC sys.sp_executesql N'
    IF NOT EXISTS (SELECT 1 FROM [dbo].[users])
        INSERT INTO [dbo].[users] ([name], [email])
        VALUES (N''Knowledge User'', N''knowledge-user@localhost.invalid'');
';
