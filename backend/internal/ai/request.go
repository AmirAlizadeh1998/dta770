package ai

import (
	"encoding/json"
	"fmt"

	"dta770/internal/analysis/models"
)

func BuildUserMessage(req models.AIRequest) (string, error) {
	b, err := json.MarshalIndent(req, "", "  ")
	if err != nil {
		return "", err
	}

	return fmt.Sprintf(`
Analyze the following electrical monitoring report.

JSON:

%s
`, string(b)), nil
}
