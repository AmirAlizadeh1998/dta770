// generalHelpers.go

package analysis

import (
	"dta770/internal/analysis/models"
	"strconv"
	"strings"
)

func normalize(s string) string {

	s = strings.TrimSpace(s)

	s = strings.ToLower(s)

	s = strings.ReplaceAll(s, "-", "_")
	s = strings.ReplaceAll(s, " ", "_")
	s = strings.ReplaceAll(s, "__", "_")

	return s
}

func assignField(r *models.Record, column string, value string) {

	if column == "timestamp" {
		r.Timestamp = value
		return
	}

	f, err := parseFloat(value)
	if err != nil {
		return
	}

	if setter, ok := columnMap[column]; ok {
		setter(r, f)
		return
	}

	r.Extra[column] = f
}

func parseFloat(v string) (float64, error) {

	v = strings.TrimSpace(v)

	if v == "" {
		return 0, nil
	}

	switch strings.ToLower(v) {
	case "-", "--", "nan", "null", "n/a", "inf", "+inf", "-inf", "infinity":
		return 0, nil
	}

	// بعضی ستون‌ها مثل sig_quality مقدار %74 دارند.
	if strings.HasPrefix(v, "%") {
		v = strings.TrimPrefix(v, "%")
	}

	return strconv.ParseFloat(v, 64)
}
