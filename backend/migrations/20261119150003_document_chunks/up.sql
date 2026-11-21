IF OBJECT_ID(N'dbo.document_chunks', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[document_chunks] (
        [id] INT IDENTITY(1,1) NOT NULL,
        [document_id] INT NOT NULL,
        [chunk_index] INT NOT NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        [page_number] INT NULL,
        [token_count] INT NULL,
        [metadata] NVARCHAR(MAX) NULL,
        [created_at] DATETIME2(0) NOT NULL CONSTRAINT [document_chunks_created_at_df] DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT [document_chunks_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [document_chunks_document_id_chunk_index_key] UNIQUE ([document_id], [chunk_index]),
        CONSTRAINT [document_chunks_document_id_fkey] FOREIGN KEY ([document_id])
            REFERENCES [dbo].[documents] ([id]) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT [document_chunks_page_number_check] CHECK ([page_number] IS NULL OR [page_number] > 0),
        CONSTRAINT [document_chunks_token_count_check] CHECK ([token_count] IS NULL OR [token_count] >= 0),
        CONSTRAINT [document_chunks_metadata_json_check] CHECK ([metadata] IS NULL OR ISJSON([metadata]) = 1),
        CONSTRAINT [document_chunks_chunk_index_check] CHECK ([chunk_index] >= 0),
        CONSTRAINT [document_chunks_content_check] CHECK (LEN(LTRIM(RTRIM([content]))) > 0)
    );
END;

IF COL_LENGTH(N'dbo.document_chunks', N'page_number') IS NULL
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[document_chunks] ADD [page_number] INT NULL;';

IF COL_LENGTH(N'dbo.document_chunks', N'token_count') IS NULL
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[document_chunks] ADD [token_count] INT NULL;';

IF COL_LENGTH(N'dbo.document_chunks', N'metadata') IS NULL
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[document_chunks] ADD [metadata] NVARCHAR(MAX) NULL;';

IF COL_LENGTH(N'dbo.document_chunks', N'created_at') IS NULL
BEGIN
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[document_chunks]
        ADD [created_at] DATETIME2(0) NOT NULL CONSTRAINT [document_chunks_created_at_df] DEFAULT (SYSUTCDATETIME());
    ';
    EXEC sys.sp_executesql N'
        UPDATE c
        SET [created_at] = d.[created_at]
        FROM [dbo].[document_chunks] c
        JOIN [dbo].[documents] d ON d.[id] = c.[document_id];
    ';
END;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'document_chunks_page_number_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[document_chunks]
        ADD CONSTRAINT [document_chunks_page_number_check] CHECK ([page_number] IS NULL OR [page_number] > 0);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'document_chunks_token_count_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[document_chunks]
        ADD CONSTRAINT [document_chunks_token_count_check] CHECK ([token_count] IS NULL OR [token_count] >= 0);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'document_chunks_metadata_json_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[document_chunks]
        ADD CONSTRAINT [document_chunks_metadata_json_check] CHECK ([metadata] IS NULL OR ISJSON([metadata]) = 1);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'document_chunks_chunk_index_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[document_chunks]
        ADD CONSTRAINT [document_chunks_chunk_index_check] CHECK ([chunk_index] >= 0);
    ';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'document_chunks_content_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[document_chunks]
        ADD CONSTRAINT [document_chunks_content_check] CHECK (LEN(LTRIM(RTRIM([content]))) > 0);
    ';
