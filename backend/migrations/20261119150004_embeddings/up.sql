IF OBJECT_ID(N'dbo.embeddings', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[embeddings] (
        [id] INT IDENTITY(1,1) NOT NULL,
        [chunk_id] INT NOT NULL,
        [embedding] NVARCHAR(MAX) NOT NULL,
        [model_name] NVARCHAR(100) NOT NULL,
        [created_at] DATETIME2(0) NOT NULL CONSTRAINT [embeddings_created_at_df] DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT [embeddings_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [embeddings_chunk_id_key] UNIQUE ([chunk_id]),
        CONSTRAINT [embeddings_chunk_id_fkey] FOREIGN KEY ([chunk_id])
            REFERENCES [dbo].[document_chunks] ([id]) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT [embeddings_embedding_json_check] CHECK (ISJSON([embedding]) = 1),
        CONSTRAINT [embeddings_model_name_check] CHECK (LEN(LTRIM(RTRIM([model_name]))) > 0)
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE [name] = N'embeddings_model_name_check')
    EXEC sys.sp_executesql N'
        ALTER TABLE [dbo].[embeddings]
        ADD CONSTRAINT [embeddings_model_name_check]
            CHECK (LEN(LTRIM(RTRIM([model_name]))) > 0);
    ';

IF COL_LENGTH(N'dbo.document_chunks', N'embedding') IS NOT NULL
BEGIN
    EXEC sys.sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM [dbo].[embeddings])
            INSERT INTO [dbo].[embeddings] ([chunk_id], [embedding], [model_name], [created_at])
            SELECT [id], [embedding], N''legacy'', [created_at]
            FROM [dbo].[document_chunks];
    ';
    EXEC sys.sp_executesql N'ALTER TABLE [dbo].[document_chunks] DROP COLUMN [embedding];';
END;
