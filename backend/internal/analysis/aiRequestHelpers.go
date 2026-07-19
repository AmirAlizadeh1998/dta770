// aiRequestHelpers.go

package analysis

import (
	"dta770/internal/analysis/models"
	"fmt"
	"math"
)

func BuildAIRequest(records []models.Record) models.AIRequest {

	if len(records) == 0 {
		return models.AIRequest{}
	}

	stats := CalculateStatistics(records)

	return models.AIRequest{
		Timestamp: models.TimestampRange{
			From: records[0].Timestamp,
			To:   records[len(records)-1].Timestamp,
		},
		Statistics: stats,
		Warnings:   DetectWarnings(stats),
		Events:     DetectEvents(records),
		Metadata: models.Metadata{
			RecordCount: len(records),
		},
	}
}

const (
	voltageNominal      = 220.0
	voltageHighPct      = 0.10
	voltageLowPct       = 0.10
	voltageImbalancePct = 0.02
	currentImbalancePct = 0.10
	currentCriticalPct  = 0.20
	pfWarning           = 0.85
	pfCritical          = 0.75
	thdCurrWarning      = 8.0
	thdCurrCritical     = 15.0
	thdVoltWarning      = 5.0
	freqNominal         = 50.0
	freqTolerance       = 0.5
)

func imbalance(a, b, c float64) float64 {
	avg := (a + b + c) / 3
	if avg == 0 {
		return 0
	}
	return math.Max(math.Abs(a-avg), math.Max(math.Abs(b-avg), math.Abs(c-avg))) / avg
}

func DetectWarnings(stats models.Statistics) []models.Warning {
	var w []models.Warning

	// Voltage high/low — اضافه شدن زمان دقیق پیک و افت
	for _, ph := range []struct {
		s     models.MetricSummary
		label string
	}{
		{stats.Voltage.RN, "RN"}, {stats.Voltage.SN, "SN"}, {stats.Voltage.TN, "TN"},
	} {
		if ph.s.Maximum.Max > voltageNominal*(1+voltageHighPct) {
			w = append(w, models.Warning{
				Code: fmt.Sprintf("VOLT_%s_HIGH", ph.label), Severity: "warning", Category: "voltage",
				Title: fmt.Sprintf("ولتاژ فاز %s بالا", ph.label),
				// اینجا از MaxTime استفاده کردیم 👇
				Description:    fmt.Sprintf("حداکثر: %.1f V (زمان: %s)", ph.s.Maximum.Max, ph.s.Maximum.MaxTime),
				Recommendation: "بررسی تنظیمات ترانسفورماتور",
			})
		}
		if ph.s.Minimum.Min < voltageNominal*(1-voltageLowPct) {
			w = append(w, models.Warning{
				Code: fmt.Sprintf("VOLT_%s_LOW", ph.label), Severity: "warning", Category: "voltage",
				Title: fmt.Sprintf("ولتاژ فاز %s پایین", ph.label),
				// اینجا از MinTime استفاده کردیم 👇
				Description:    fmt.Sprintf("حداقل: %.1f V (زمان: %s)", ph.s.Minimum.Min, ph.s.Minimum.MinTime),
				Recommendation: "بررسی افت ولتاژ در مسیر تغذیه",
			})
		}
	}

	// Voltage imbalance — این یکی چون روی میانگینِ کله، زمان خاصی نداره
	if vi := imbalance(stats.Voltage.RN.Average.Mean, stats.Voltage.SN.Average.Mean, stats.Voltage.TN.Average.Mean); vi > voltageImbalancePct {
		w = append(w, models.Warning{
			Code: "VOLT_IMBALANCE", Severity: "warning", Category: "voltage",
			Title:          "عدم تعادل ولتاژ فازها",
			Description:    fmt.Sprintf("عدم تعادل: %.1f%%", vi*100),
			Recommendation: "توزیع مجدد بارها بین فازها",
		})
	}

	// Current imbalance
	if ci := imbalance(stats.Current.IR.Average.Mean, stats.Current.IS.Average.Mean, stats.Current.IT.Average.Mean); ci > currentImbalancePct {
		sev := models.Severity("warning")
		if ci > currentCriticalPct {
			sev = "critical"
		}
		w = append(w, models.Warning{
			Code: "CURR_IMBALANCE", Severity: sev, Category: "current",
			Title:          "عدم تعادل جریان فازها",
			Description:    fmt.Sprintf("عدم تعادل: %.1f%%", ci*100),
			Recommendation: "بررسی و توزیع مجدد بارهای تک‌فاز",
		})
	}

	// Power factor
	pf := math.Abs(stats.PowerFactor.Total.Average.Mean)
	if pf < pfCritical {
		w = append(w, models.Warning{
			Code: "PF_CRITICAL", Severity: "critical", Category: "power_factor",
			Title:          "ضریب توان بحرانی",
			Description:    fmt.Sprintf("میانگین کل: %.2f", pf),
			Recommendation: "نصب خازن جبران‌ساز ضروری است",
		})
	} else if pf < pfWarning {
		w = append(w, models.Warning{
			Code: "PF_LOW", Severity: "warning", Category: "power_factor",
			Title:          "ضریب توان پایین",
			Description:    fmt.Sprintf("میانگین کل: %.2f", pf),
			Recommendation: "بررسی نصب خازن جبران‌ساز",
		})
	}

	// THD current — زمان حداکثر THD به هشدار Critical اضافه شد
	for _, ph := range []struct {
		s     models.Summary
		label string
	}{
		{stats.Thd.Current.ThdIr, "R"}, {stats.Thd.Current.ThdIs, "S"}, {stats.Thd.Current.ThdIt, "T"},
	} {
		if ph.s.Max > thdCurrCritical {
			w = append(w, models.Warning{
				Code: fmt.Sprintf("THD_I%s_CRITICAL", ph.label), Severity: "critical", Category: "thd",
				Title: fmt.Sprintf("THD جریان فاز %s بحرانی", ph.label),
				// اینجا هم از MaxTime استفاده کردیم 👇
				Description:    fmt.Sprintf("حداکثر: %.1f%% (زمان: %s)", ph.s.Max, ph.s.MaxTime),
				Recommendation: "نصب فیلتر هارمونیک اکتیو",
			})
		} else if ph.s.Mean > thdCurrWarning {
			w = append(w, models.Warning{
				Code: fmt.Sprintf("THD_I%s_HIGH", ph.label), Severity: "warning", Category: "thd",
				Title:          fmt.Sprintf("THD جریان فاز %s بالا", ph.label),
				Description:    fmt.Sprintf("میانگین: %.1f%%", ph.s.Mean),
				Recommendation: "بررسی منابع هارمونیک‌زا",
			})
		}
	}

	// THD voltage
	for _, ph := range []struct {
		s     models.Summary
		label string
	}{
		{stats.Thd.Voltage.ThdVRn, "RN"}, {stats.Thd.Voltage.ThdVSn, "SN"}, {stats.Thd.Voltage.ThdVTn, "TN"},
	} {
		if ph.s.Mean > thdVoltWarning {
			w = append(w, models.Warning{
				Code: fmt.Sprintf("THD_V%s_HIGH", ph.label), Severity: "warning", Category: "thd",
				Title:          fmt.Sprintf("THD ولتاژ %s بالا", ph.label),
				Description:    fmt.Sprintf("میانگین: %.1f%%", ph.s.Mean),
				Recommendation: "بررسی منابع هارمونیک‌زا در شبکه",
			})
		}
	}

	// Frequency
	if fm := stats.Freq.Average.Mean; fm > freqNominal+freqTolerance || fm < freqNominal-freqTolerance {
		w = append(w, models.Warning{
			Code: "FREQ_DEVIATION", Severity: "warning", Category: "frequency",
			Title:          "انحراف فرکانس شبکه",
			Description:    fmt.Sprintf("میانگین: %.2f Hz", fm),
			Recommendation: "بررسی کیفیت تغذیه از شبکه برق",
		})
	}

	return w
}

func DetectEvents(records []models.Record) []models.Event {
	var events []models.Event

	phases := []struct {
		name string
		get  func(r models.Record) models.Metric
	}{
		{"v_rn", func(r models.Record) models.Metric { return r.Voltage.RN }},
		{"v_sn", func(r models.Record) models.Metric { return r.Voltage.SN }},
		{"v_tn", func(r models.Record) models.Metric { return r.Voltage.TN }},
	}

	for i := 1; i < len(records); i++ {
		prev, curr := records[i-1], records[i]

		for _, ph := range phases {
			p, c := ph.get(prev), ph.get(curr)

			// قطع برق — اول چک می‌شه که با sag دوبار ثبت نشه
			if p.Average > 100 && c.Average < 10 {
				events = append(events, models.Event{
					Time:     curr.Timestamp,
					Code:     "POWER_OUTAGE",
					Severity: "critical",
					Category: "voltage",
					Metric:   ph.name,
					Value:    c.Average,
					Message:  fmt.Sprintf("قطع برق: ولتاژ %s از %.1f به %.1f V رسید", ph.name, p.Average, c.Average),
				})
				continue
			}

			// افت ناگهانی ولتاژ (sag) — افت بیش از ۱۰٪ نسبت به رکورد قبل
			if p.Average > 0 && (c.Average/p.Average) < 0.9 {
				events = append(events, models.Event{
					Time:     curr.Timestamp,
					Code:     "VOLT_SAG",
					Severity: "critical",
					Category: "voltage",
					Metric:   ph.name,
					Value:    c.Average,
					Message:  fmt.Sprintf("افت ناگهانی ولتاژ %s: از %.1f به %.1f V", ph.name, p.Average, c.Average),
				})
			}

			// جهش ناگهانی ولتاژ (swell) — افزایش بیش از ۱۰٪
			if p.Average > 0 && (c.Average/p.Average) > 1.1 && p.Average > 100 {
				events = append(events, models.Event{
					Time:     curr.Timestamp,
					Code:     "VOLT_SWELL",
					Severity: "warning",
					Category: "voltage",
					Metric:   ph.name,
					Value:    c.Average,
					Message:  fmt.Sprintf("جهش ناگهانی ولتاژ %s: از %.1f به %.1f V", ph.name, p.Average, c.Average),
				})
			}

			// وصل مجدد برق
			if p.Average < 10 && c.Average > 100 {
				events = append(events, models.Event{
					Time:     curr.Timestamp,
					Code:     "POWER_RESTORED",
					Severity: "info",
					Category: "voltage",
					Metric:   ph.name,
					Value:    c.Average,
					Message:  fmt.Sprintf("وصل مجدد برق: ولتاژ %s به %.1f V برگشت", ph.name, c.Average),
				})
			}

			// افت داخل بازه — sag کوتاهی که میانگین رو خراب نکرده ولی Min گرفتتش
			if c.Average > 190 && c.Minimum > 0 && c.Minimum < c.Average*0.85 {
				events = append(events, models.Event{
					Time:     curr.Timestamp,
					Code:     "VOLT_DIP_INTRA",
					Severity: "warning",
					Category: "voltage",
					Metric:   ph.name,
					Value:    c.Minimum,
					Message:  fmt.Sprintf("افت لحظه‌ای ولتاژ %s داخل بازه: حداقل %.1f V (میانگین %.1f V)", ph.name, c.Minimum, c.Average),
				})
			}
		}
	}

	return events
}
