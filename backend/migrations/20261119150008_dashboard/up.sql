IF OBJECT_ID(N'dbo.dashboard', N'U') IS NULL
BEGIN
    IF OBJECT_ID(N'dbo.dashboards', N'U') IS NOT NULL
        EXEC sys.sp_rename N'dbo.dashboards', N'dashboard';
    ELSE
        EXEC sys.sp_executesql N'
            CREATE TABLE [dbo].[dashboard] (
                [id] INT IDENTITY(1,1) NOT NULL,
                [user_id] INT NOT NULL,
                [total_documents] INT NOT NULL CONSTRAINT [dashboard_total_documents_df] DEFAULT (0),
                [ready_documents] INT NOT NULL CONSTRAINT [dashboard_ready_documents_df] DEFAULT (0),
                [total_chats] INT NOT NULL CONSTRAINT [dashboard_total_chats_df] DEFAULT (0),
                [total_questions] INT NOT NULL CONSTRAINT [dashboard_total_questions_df] DEFAULT (0),
                [total_answers] INT NOT NULL CONSTRAINT [dashboard_total_answers_df] DEFAULT (0),
                [snapshot_at] DATETIME2(0) NOT NULL CONSTRAINT [dashboard_snapshot_at_df] DEFAULT (SYSUTCDATETIME()),
                CONSTRAINT [dashboard_pkey] PRIMARY KEY CLUSTERED ([id]),
                CONSTRAINT [dashboard_user_id_key] UNIQUE ([user_id]),
                CONSTRAINT [dashboard_user_id_fkey] FOREIGN KEY ([user_id])
                    REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT [dashboard_counts_check] CHECK (
                    [total_documents] >= 0 AND [ready_documents] >= 0 AND
                    [total_chats] >= 0 AND [total_questions] >= 0 AND [total_answers] >= 0
                )
            );
        ';
END;

IF COL_LENGTH(N'dbo.dashboard', N'user_id') IS NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'dashboards_profile_id_fkey')
        EXEC sys.sp_executesql N'ALTER TABLE [dbo].[dashboard] DROP CONSTRAINT [dashboards_profile_id_fkey];';
    IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE [name] = N'dashboards_profile_id_key')
        EXEC sys.sp_executesql N'ALTER TABLE [dbo].[dashboard] DROP CONSTRAINT [dashboards_profile_id_key];';
    EXEC sys.sp_rename N'dbo.dashboard.profile_id', N'user_id', N'COLUMN';
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'dashboard_user_id_fkey')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[dashboard]
        ADD CONSTRAINT [dashboard_user_id_fkey] FOREIGN KEY ([user_id])
            REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE ON UPDATE CASCADE;
    ';

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE [name] = N'dashboard_user_id_key')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[dashboard]
        ADD CONSTRAINT [dashboard_user_id_key] UNIQUE ([user_id]);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'dashboard_counts_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[dashboard]
        ADD CONSTRAINT [dashboard_counts_check] CHECK (
            [total_documents] >= 0 AND [ready_documents] >= 0 AND
            [total_chats] >= 0 AND [total_questions] >= 0 AND [total_answers] >= 0
        );
    ';

IF OBJECT_ID(N'dbo.profiles', N'U') IS NOT NULL
    DROP TABLE [dbo].[profiles];
