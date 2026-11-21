IF OBJECT_ID(N'dbo.documents', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[documents] (
        [id] INT IDENTITY(1,1) NOT NULL,
        [user_id] INT NOT NULL CONSTRAINT [documents_user_id_df] DEFAULT (1),
        [title] NVARCHAR(255) NOT NULL,
        [file_name] NVARCHAR(255) NOT NULL,
        [file_path] NVARCHAR(500) NOT NULL,
        [file_type] NVARCHAR(50) NOT NULL,
        [file_size] BIGINT NOT NULL,
        [status] NVARCHAR(30) NOT NULL CONSTRAINT [documents_status_df] DEFAULT (N'processing'),
        [total_chunks] INT NOT NULL CONSTRAINT [documents_total_chunks_df] DEFAULT (0),
        [metadata] NVARCHAR(MAX) NULL,
        [created_at] DATETIME2(0) NOT NULL CONSTRAINT [documents_created_at_df] DEFAULT (SYSUTCDATETIME()),
        [updated_at] DATETIME2(0) NOT NULL CONSTRAINT [documents_updated_at_df] DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT [documents_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [documents_user_id_fkey] FOREIGN KEY ([user_id])
            REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT [documents_status_check] CHECK ([status] IN (N'processing', N'ready', N'failed')),
        CONSTRAINT [documents_file_type_check] CHECK ([file_type] IN (N'PDF', N'DOCX', N'TXT', N'UNKNOWN')),
        CONSTRAINT [documents_total_chunks_check] CHECK ([total_chunks] >= 0),
        CONSTRAINT [documents_metadata_json_check] CHECK ([metadata] IS NULL OR ISJSON([metadata]) = 1),
        CONSTRAINT [documents_file_size_check] CHECK ([file_size] > 0),
        CONSTRAINT [documents_title_check] CHECK (LEN(LTRIM(RTRIM([title]))) > 0),
        CONSTRAINT [documents_file_name_check] CHECK (LEN(LTRIM(RTRIM([file_name]))) > 0),
        CONSTRAINT [documents_file_path_check] CHECK (LEN(LTRIM(RTRIM([file_path]))) > 0)
    );
END;

IF COL_LENGTH(N'dbo.documents', N'file_name') IS NULL
    EXEC sys.sp_rename N'dbo.documents.original_name', N'file_name', N'COLUMN';

IF COL_LENGTH(N'dbo.documents', N'file_path') IS NULL
    EXEC sys.sp_rename N'dbo.documents.storage_path', N'file_path', N'COLUMN';

IF COL_LENGTH(N'dbo.documents', N'user_id') IS NULL
BEGIN
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[documents] ADD [user_id] INT NULL;';
    IF COL_LENGTH(N'dbo.documents', N'profile_id') IS NOT NULL
        EXEC sys.sp_executesql N'UPDATE [dbo].[documents] SET [user_id] = [profile_id] WHERE [user_id] IS NULL;';
    ELSE
        EXEC sys.sp_executesql N'UPDATE [dbo].[documents] SET [user_id] = 1 WHERE [user_id] IS NULL;';
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[documents] ALTER COLUMN [user_id] INT NOT NULL;';
END;

IF COL_LENGTH(N'dbo.documents', N'file_type') IS NULL
BEGIN
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[documents] ADD [file_type] NVARCHAR(50) NULL;';
    EXEC sys.sp_executesql N'
        UPDATE [dbo].[documents]
        SET [file_type] = CASE
            WHEN LOWER(RIGHT([file_name], 4)) = N''.pdf'' THEN N''PDF''
            WHEN LOWER(RIGHT([file_name], 4)) = N''.txt'' THEN N''TXT''
            WHEN LOWER(RIGHT([file_name], 5)) = N''.docx'' THEN N''DOCX''
            ELSE N''UNKNOWN''
        END
        WHERE [file_type] IS NULL;
    ';
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[documents] ALTER COLUMN [file_type] NVARCHAR(50) NOT NULL;';
END;

IF COL_LENGTH(N'dbo.documents', N'total_chunks') IS NULL
BEGIN
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[documents]
        ADD [total_chunks] INT NOT NULL CONSTRAINT [documents_total_chunks_df] DEFAULT (0);
    ';
    IF OBJECT_ID(N'dbo.document_chunks', N'U') IS NOT NULL
        EXEC sys.sp_executesql N'
            UPDATE d
            SET [total_chunks] = (SELECT COUNT(*) FROM [dbo].[document_chunks] c WHERE c.[document_id] = d.[id])
            FROM [dbo].[documents] d;
        ';
END;

IF COL_LENGTH(N'dbo.documents', N'metadata') IS NULL
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[documents] ADD [metadata] NVARCHAR(MAX) NULL;';

IF COL_LENGTH(N'dbo.documents', N'updated_at') IS NULL
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[documents]
        ADD [updated_at] DATETIME2(0) NOT NULL CONSTRAINT [documents_updated_at_df] DEFAULT (SYSUTCDATETIME());
    ';

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE [name] = N'documents_user_id_df')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[documents]
        ADD CONSTRAINT [documents_user_id_df] DEFAULT (1) FOR [user_id];
    ';

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'documents_user_id_fkey')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[documents]
        ADD CONSTRAINT [documents_user_id_fkey] FOREIGN KEY ([user_id])
            REFERENCES [dbo].[users] ([id]) ON DELETE CASCADE ON UPDATE CASCADE;
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'documents_file_type_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[documents]
        ADD CONSTRAINT [documents_file_type_check] CHECK ([file_type] IN (N''PDF'', N''DOCX'', N''TXT'', N''UNKNOWN''));
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'documents_total_chunks_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[documents]
        ADD CONSTRAINT [documents_total_chunks_check] CHECK ([total_chunks] >= 0);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'documents_metadata_json_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[documents]
        ADD CONSTRAINT [documents_metadata_json_check] CHECK ([metadata] IS NULL OR ISJSON([metadata]) = 1);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'documents_file_size_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[documents]
        ADD CONSTRAINT [documents_file_size_check] CHECK ([file_size] > 0);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'documents_title_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[documents]
        ADD CONSTRAINT [documents_title_check] CHECK (LEN(LTRIM(RTRIM([title]))) > 0);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'documents_file_name_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[documents]
        ADD CONSTRAINT [documents_file_name_check] CHECK (LEN(LTRIM(RTRIM([file_name]))) > 0);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'documents_file_path_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[documents]
        ADD CONSTRAINT [documents_file_path_check] CHECK (LEN(LTRIM(RTRIM([file_path]))) > 0);
    ';

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'documents_profile_id_fkey')
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[documents] DROP CONSTRAINT [documents_profile_id_fkey];';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'documents_profile_id_created_at_idx')
    EXEC sys.sp_executesql N'DROP INDEX [documents_profile_id_created_at_idx] ON [dbo].[documents];';

IF COL_LENGTH(N'dbo.documents', N'profile_id') IS NOT NULL
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[documents] DROP COLUMN [profile_id];';

IF COL_LENGTH(N'dbo.documents', N'mime_type') IS NOT NULL
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[documents] DROP COLUMN [mime_type];';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'documents_user_id_created_at_idx')
    EXEC sys.sp_executesql N'
        CREATE INDEX [documents_user_id_created_at_idx]
        ON [dbo].[documents] ([user_id], [created_at]);
    ';
