IF OBJECT_ID(N'dbo.profiles', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[profiles] (
        [id] INT IDENTITY(1,1) NOT NULL,
        [profile_name] NVARCHAR(120) NOT NULL,
        [chat_model] NVARCHAR(120) NOT NULL,
        [temperature] FLOAT NOT NULL,
        [created_at] DATETIME2(0) NOT NULL,
        [updated_at] DATETIME2(0) NOT NULL,
        CONSTRAINT [profiles_pkey] PRIMARY KEY CLUSTERED ([id])
    );
    SET IDENTITY_INSERT [dbo].[profiles] ON;
    INSERT INTO [dbo].[profiles] ([id], [profile_name], [chat_model], [temperature], [created_at], [updated_at])
    SELECT [id], LEFT([name], 120), [chat_model], [temperature], [created_at], [updated_at]
    FROM [dbo].[users];
    SET IDENTITY_INSERT [dbo].[profiles] OFF;
END;

IF COL_LENGTH(N'dbo.dashboard', N'profile_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[dashboard] DROP CONSTRAINT [dashboard_user_id_key];
    ALTER TABLE [dbo].[dashboard] DROP CONSTRAINT [dashboard_user_id_fkey];
    EXEC sys.sp_rename N'dbo.dashboard.user_id', N'profile_id', N'COLUMN';
    ALTER TABLE [dbo].[dashboard]
        ADD CONSTRAINT [dashboards_profile_id_key] UNIQUE ([profile_id]),
            CONSTRAINT [dashboards_profile_id_fkey] FOREIGN KEY ([profile_id])
                REFERENCES [dbo].[profiles] ([id]) ON DELETE CASCADE ON UPDATE CASCADE;
END;
EXEC sys.sp_rename N'dbo.dashboard', N'dashboards';
