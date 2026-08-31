package ai

import (
	"context"
	"dta770/internal/analysis/models"
	"fmt"

	"github.com/openai/openai-go"
)

// GenerateReportStream تحلیل رو به صورت تکه‌تکه (Stream) برای جلوگیری از تایم‌اوت ارسال می‌کنه
func GenerateReportStream(
	ctx context.Context,
	client *openai.Client,
	req models.AIRequest,
	onChunk func(string),
) error {
	userMessage, err := BuildUserMessage(req)
	if err != nil {
		return fmt.Errorf("failed to build user message: %w", err)
	}

	// ایجاد استریم رکوئست با مدل و پرامپت‌های اختصاصی خودت
	stream := client.Chat.Completions.NewStreaming(ctx, openai.ChatCompletionNewParams{
		Model: "claude-fable-5",
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(SystemPrompt),
			openai.UserMessage(userMessage),
		},
	})

	// خوندن توکن‌به‌توکن پاسخ و پاس دادنش به کال‌بک هندلر
	for stream.Next() {
		chunk := stream.Current()
		if len(chunk.Choices) > 0 {
			content := chunk.Choices[0].Delta.Content
			if content != "" {
				onChunk(content)
			}
		}
	}

	if err := stream.Err(); err != nil {
		return fmt.Errorf("stream error: %w", err)
	}

	return nil
}
