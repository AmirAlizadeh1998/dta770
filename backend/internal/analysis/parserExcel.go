package analysis

import (
	"dta770/internal/analysis/models"

	"github.com/xuri/excelize/v2"
)

func ParseExcel(path string) ([]models.Record, error) {

	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = f.Close()
	}()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, nil
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, err
	}

	if len(rows) == 0 {
		return nil, nil
	}

	headers := rows[0]

	for i := range headers {
		headers[i] = normalize(headers[i])
	}

	var records []models.Record

	for _, row := range rows[1:] {

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
