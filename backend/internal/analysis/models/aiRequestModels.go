// aiRequestModels.go

package models

type AIRequest struct {
	Timestamp TimestampRange `json:"timestamp"`

	Statistics Statistics `json:"statistics"`

	Warnings []Warning `json:"warnings,omitempty"`

	Events []Event `json:"events,omitempty"`

	Metadata Metadata `json:"metadata"`
}

type TimestampRange struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type Metadata struct {
	RecordCount int `json:"record_count"`

	IMEI        string `json:"imei,omitempty"`
	DeviceModel string `json:"device_model,omitempty"`

	FileName string `json:"file_name,omitempty"`

	GeneratedAt string `json:"generated_at,omitempty"`

	Version string `json:"version,omitempty"`
}
