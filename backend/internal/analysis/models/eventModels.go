// eventModels.go

package models

type Severity string
type Category string

type Warning struct {
	Code           string
	Severity       Severity
	Category       Category
	Title          string
	Description    string
	Recommendation string
}

type Event struct {
	Time     string
	Code     string
	Severity Severity
	Category Category
	Metric   string
	Value    float64
	Message  string
}
