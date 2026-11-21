IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.users', N'chat_model') IS NOT NULL
BEGIN
    UPDATE [dbo].[users]
    SET [chat_model] = N'qwen-plus'
    WHERE [chat_model] <> N'qwen-plus';

    DECLARE @chatModelDefault sysname;
    SELECT @chatModelDefault = dc.[name]
    FROM sys.default_constraints dc
    JOIN sys.columns c
      ON c.[object_id] = dc.[parent_object_id]
     AND c.[column_id] = dc.[parent_column_id]
    WHERE dc.[parent_object_id] = OBJECT_ID(N'dbo.users')
      AND c.[name] = N'chat_model';

    IF @chatModelDefault IS NOT NULL
    BEGIN
        DECLARE @dropConstraintSql NVARCHAR(4000);
        SET @dropConstraintSql =
            N'ALTER TABLE [dbo].[users] DROP CONSTRAINT ' + QUOTENAME(@chatModelDefault);
        EXEC sys.sp_executesql @dropConstraintSql;
    END;

    ALTER TABLE [dbo].[users]
    ADD CONSTRAINT [users_chat_model_df] DEFAULT (N'qwen-plus') FOR [chat_model];
END;
