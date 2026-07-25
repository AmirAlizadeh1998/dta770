package ai

import (
	"context"
	"errors"
	"fmt"

	"dta770/internal/analysis/models"

	"github.com/openai/openai-go"
)

func GenerateReport(
	client *openai.Client,
	req models.AIRequest,
) (string, error) {

	userMessage, err := BuildUserMessage(req)
	if err != nil {
		return "", err
	}

	resp, err := client.Chat.Completions.New(context.Background(), openai.ChatCompletionNewParams{
		Model: "claude-fable-5",
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(SystemPrompt),
			openai.UserMessage(userMessage),
		},
	})
	if err != nil {
		return "", fmt.Errorf("AI request failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", errors.New("empty response")
	}

	return resp.Choices[0].Message.Content, nil
}
