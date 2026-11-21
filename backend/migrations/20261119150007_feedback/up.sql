IF OBJECT_ID(N'dbo.feedback', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[feedback] (
        [id] INT IDENTITY(1,1) NOT NULL,
        [message_id] INT NOT NULL,
        [user_id] INT NOT NULL,
        [rating] INT NOT NULL,
        [comments] NVARCHAR(MAX) NULL,
        [created_at] DATETIME2(0) NOT NULL CONSTRAINT [feedback_created_at_df] DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT [feedback_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [feedback_rating_check] CHECK ([rating] BETWEEN 1 AND 5),
        CONSTRAINT [feedback_message_id_fkey] FOREIGN KEY ([message_id])
            REFERENCES [dbo].[chat_messages] ([id]) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT [feedback_user_id_fkey] FOREIGN KEY ([user_id])
            REFERENCES [dbo].[users] ([id])
    );
    CREATE INDEX [feedback_user_id_created_at_idx]
        ON [dbo].[feedback] ([user_id], [created_at]);
END;
