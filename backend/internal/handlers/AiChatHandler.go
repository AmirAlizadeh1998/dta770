package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/sashabaranov/go-openai"
)

type ChatRequest struct {
	Prompt string `json:"prompt"`
}

func AiChatHandler(client *openai.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")

		switch r.Method {
		case http.MethodOptions:
			w.WriteHeader(http.StatusOK)
			return

		case http.MethodPost:
			handlePostChat(client, w, r)

		default:
			http.Error(w, "متد غیرمجاز", http.StatusMethodNotAllowed)
		}
	}
}

func handlePostChat(client *openai.Client, w http.ResponseWriter, r *http.Request) {
	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "فرمت درخواست نامعتبر است", http.StatusBadRequest)
		return
	}

	resp, err := client.CreateChatCompletion(
		r.Context(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4o,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: req.Prompt,
				},
			},
		},
	)
	if err != nil {
		http.Error(w, fmt.Sprintf("خطا در اتصال به OpenAI: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"reply": resp.Choices[0].Message.Content,
	})
}
