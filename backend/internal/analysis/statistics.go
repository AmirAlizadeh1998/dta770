// statistics.go

package analysis

import "dta770/internal/analysis/models"

func CalculateStatistics(records []models.Record) models.Statistics {

	// آستانه فیلتر — رکوردهایی که جریان کل زیر این مقدار باشه حذف میشن
	const minCurrentThreshold = 0.5 // آمپر

	pfFilterR := func(r models.Record) bool {
		return r.Current.R.Value >= minCurrentThreshold
	}
	pfFilterS := func(r models.Record) bool {
		return r.Current.S.Value >= minCurrentThreshold
	}
	pfFilterT := func(r models.Record) bool {
		return r.Current.T.Value >= minCurrentThreshold
	}
	pfFilter := func(r models.Record) bool {
		totalCurrent := r.Current.R.Value + r.Current.S.Value + r.Current.T.Value
		return totalCurrent >= minCurrentThreshold
	}

	return models.Statistics{
		// VOLTAGE
		Voltage: models.VoltageStatistics{
			// PHASE TO PHASE
			RN: calculateMetricSummary(records, func(r models.Record) models.Metric {
				return r.Voltage.RN
			}),
			RS: calculateMetricSummary(records, func(r models.Record) models.Metric {
				return r.Voltage.RS
			}),
			RT: calculateMetricSummary(records, func(r models.Record) models.Metric {
				return r.Voltage.RT
			}),
			// PHASE TO NULL
			SN: calculateMetricSummary(records, func(r models.Record) models.Metric {
				return r.Voltage.SN
			}),
			TN: calculateMetricSummary(records, func(r models.Record) models.Metric {
				return r.Voltage.TN
			}),
			TS: calculateMetricSummary(records, func(r models.Record) models.Metric {
				return r.Voltage.TS
			}),
		},

		// CURRENT
		Current: models.CurrentStatistics{
			IR: calculateMetricSummary(records, func(r models.Record) models.Metric {
				return r.Current.R
			}),
			IS: calculateMetricSummary(records, func(r models.Record) models.Metric {
				return r.Current.S
			}),
			IT: calculateMetricSummary(records, func(r models.Record) models.Metric {
				return r.Current.T
			}),
		},

		//Frequency
		Freq: models.FrequencyStatistics{
			Average: calculateSummary(records, func(r models.Record) float64 {
				return r.Frequency.Average
			}),
			Minimum: calculateSummary(records, func(r models.Record) float64 {
				return r.Frequency.Minimum
			}),
			Maximum: calculateSummary(records, func(r models.Record) float64 {
				return r.Frequency.Maximum
			}),
			Value: calculateSummary(records, func(r models.Record) float64 {
				return r.Frequency.Value
			}),
		},

		// THD
		Thd: models.ThdStatistics{

			Current: models.ThdCurrentStat{

				ThdIr: calculateSummary(records, func(r models.Record) float64 {
					return r.THD.Current.ThdIr
				}),

				ThdIs: calculateSummary(records, func(r models.Record) float64 {
					return r.THD.Current.ThdIs
				}),

				ThdIt: calculateSummary(records, func(r models.Record) float64 {
					return r.THD.Current.ThdIt
				}),
			},

			Voltage: models.ThdVoltageStat{

				ThdVRn: calculateSummary(records, func(r models.Record) float64 {
					return r.THD.Voltage.ThdVRn
				}),

				ThdVRs: calculateSummary(records, func(r models.Record) float64 {
					return r.THD.Voltage.ThdVRs
				}),

				ThdVRt: calculateSummary(records, func(r models.Record) float64 {
					return r.THD.Voltage.ThdVRt
				}),

				ThdVSn: calculateSummary(records, func(r models.Record) float64 {
					return r.THD.Voltage.ThdVSn
				}),

				ThdVSt: calculateSummary(records, func(r models.Record) float64 {
					return r.THD.Voltage.ThdVSt
				}),

				ThdVTn: calculateSummary(records, func(r models.Record) float64 {
					return r.THD.Voltage.ThdVTn
				}),
			},
		},

		// POWER FACTOR
		PowerFactor: models.PowerFactorStatistics{
			R: calculateMetricSummaryFiltered(records, func(r models.Record) models.Metric {
				return r.PowerFactor.R
			}, pfFilterR), // ← فیلتر اختصاصی فاز R
			S: calculateMetricSummaryFiltered(records, func(r models.Record) models.Metric {
				return r.PowerFactor.S
			}, pfFilterS), // ← فیلتر اختصاصی فاز S
			T: calculateMetricSummaryFiltered(records, func(r models.Record) models.Metric {
				return r.PowerFactor.T
			}, pfFilterT), // ← فیلتر اختصاصی فاز T
			Total: calculateMetricSummaryFiltered(records, func(r models.Record) models.Metric {
				return r.PowerFactor.Total
			}, pfFilter), // ← مجموع سه‌فاز برای Total منطقیه
		},

		//POWER
		Power: models.PowerStatistics{

			Active: calculateThreePhasePowerSummary(records, func(r models.Record) models.ThreePhasePower {
				return r.Power.Active
			}),

			Reactive: calculateThreePhasePowerSummary(records, func(r models.Record) models.ThreePhasePower {
				return r.Power.Reactive
			}),

			Apparent: calculateThreePhasePowerSummary(records, func(r models.Record) models.ThreePhasePower {
				return r.Power.Apparent
			}),
		},
	}
}
