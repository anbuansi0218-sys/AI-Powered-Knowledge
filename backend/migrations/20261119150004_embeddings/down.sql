IF OBJECT_ID(N'dbo.embeddings', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.document_chunks', N'embedding') IS NULL
    BEGIN
        ALTER TABLE [dbo].[document_chunks] ADD [embedding] NVARCHAR(MAX) NULL;
        EXEC sys.sp_executesql N'
            UPDATE c
            SET [embedding] = e.[embedding]
            FROM [dbo].[document_chunks] c
            JOIN [dbo].[embeddings] e ON e.[chunk_id] = c.[id];
        ';
        EXEC sys.sp_executesql N'ALTER TABLE [dbo].[document_chunks] ALTER COLUMN [embedding] NVARCHAR(MAX) NOT NULL;';
    END;
    DROP TABLE [dbo].[embeddings];
END;
