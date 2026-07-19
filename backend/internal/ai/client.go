package ai

import (
	"context"
	"errors"

	"dta770/internal/analysis/models"

	openai "github.com/sashabaranov/go-openai"
)

func GenerateReport(
	client *openai.Client,
	req models.AIRequest,
) (string, error) {

	userMessage, err := BuildUserMessage(req)
	if err != nil {
		return "", err
	}

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4o,

			Temperature: 0.2,

			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: SystemPrompt,
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: userMessage,
				},
			},
		},
	)

	if err != nil {
		return "", err
	}

	if len(resp.Choices) == 0 {
		return "", errors.New("empty response")
	}

	return resp.Choices[0].Message.Content, nil
}
