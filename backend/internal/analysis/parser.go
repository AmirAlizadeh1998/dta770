// parser.go

package analysis

import (
	"dta770/internal/analysis/models"
	"encoding/csv"
	"io"
	"os"
)

// ParseCSV فایل را خوانده و رکوردها را برمی‌گرداند.
func ParseCSV(path string) ([]models.Record, error) {

	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = file.Close()
	}()

	reader := csv.NewReader(file)

	// اگر فایل جداکننده دیگری داشت بعدا قابل تغییر است
	reader.Comma = ','

	headers, err := reader.Read()
	if err != nil {
		return nil, err
	}

	for i := range headers {
		headers[i] = normalize(headers[i])
	}

	var records []models.Record

	for {

		row, err := reader.Read()

		if err == io.EOF {
			break
		}

		if err != nil {
			return nil, err
		}

		record := models.Record{
			Extra: make(map[string]float64),
			Raw:   make(map[string]string),
		}

		for i, value := range row {

			if i >= len(headers) {
				continue
			}

			column := headers[i]

			record.Raw[column] = value

			assignField(&record, column, value)
		}

		records = append(records, record)
	}

	return records, nil
}
