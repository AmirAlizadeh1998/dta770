// summarize.go

package analysis

import (
	"dta770/internal/analysis/models"
	"math"
)

func calculateSummary(
	records []models.Record,
	selector func(models.Record) float64,
) models.Summary {

	if len(records) == 0 {
		return models.Summary{}
	}

	// مقداردهی اولیه با رکورد اول
	firstVal := selector(records[0])
	minVal := firstVal
	maxVal := firstVal
	minTime := records[0].Timestamp
	maxTime := records[0].Timestamp

	sum := firstVal

	// حلقه برای پیدا کردن Min, Max و جمع کل مقادیر (از ایندکس 1 شروع می‌کنیم چون 0 رو بالا خوندیم)
	for i := 1; i < len(records); i++ {
		r := records[i]
		v := selector(r)

		if v < minVal {
			minVal = v
			minTime = r.Timestamp
		}

		if v > maxVal {
			maxVal = v
			maxTime = r.Timestamp
		}

		sum += v
	}

	count := len(records)
	mean := sum / float64(count)

	// حلقه دوم برای محاسبه انحراف معیار (Standard Deviation)
	var variance float64
	for _, r := range records {
		d := selector(r) - mean
		variance += d * d
	}

	std := math.Sqrt(variance / float64(count))

	// حالا همه‌ی مقادیر رو با زمانشون برمی‌گردونیم
	return models.Summary{
		Count:   count,
		Min:     minVal,
		MinTime: minTime, // <--- زمان کمترین مقدار
		Max:     maxVal,
		MaxTime: maxTime, // <--- زمان بیشترین مقدار
		Mean:    mean,
		StdDev:  std,
	}
}

func calculateMetricSummary(
	records []models.Record,
	selector func(models.Record) models.Metric,
) models.MetricSummary {

	return models.MetricSummary{
		Value: calculateSummary(records, func(r models.Record) float64 {
			return selector(r).Value
		}),
		Average: calculateSummary(records, func(r models.Record) float64 {
			return selector(r).Average
		}),
		Maximum: calculateSummary(records, func(r models.Record) float64 {
			return selector(r).Maximum
		}),
		Minimum: calculateSummary(records, func(r models.Record) float64 {
			return selector(r).Minimum
		}),
	}
}

func calculateThreePhasePowerSummary(
	records []models.Record,
	selector func(models.Record) models.ThreePhasePower,
) models.TppStatistics {

	return models.TppStatistics{

		R: calculateMetricSummary(records, func(r models.Record) models.Metric {
			return selector(r).R
		}),

		S: calculateMetricSummary(records, func(r models.Record) models.Metric {
			return selector(r).S
		}),

		T: calculateMetricSummary(records, func(r models.Record) models.Metric {
			return selector(r).T
		}),

		IntoGrid: calculateSummary(records, func(r models.Record) float64 {
			return selector(r).IntoGrid
		}),

		IntoLoad: calculateSummary(records, func(r models.Record) float64 {
			return selector(r).IntoLoad
		}),
	}
}
