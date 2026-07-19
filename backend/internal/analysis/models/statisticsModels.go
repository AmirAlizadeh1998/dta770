package models

type Summary struct {
	Count   int     `json:"count"`
	Min     float64 `json:"min"`
	MinTime string  `json:"minTime"`
	Max     float64 `json:"max"`
	MaxTime string  `json:"maxTime"`
	Mean    float64 `json:"mean"`
	StdDev  float64 `json:"std_dev"`
}

type MetricSummary struct {
	Value   Summary `json:"value"`
	Average Summary `json:"average"`
	Maximum Summary `json:"maximum"`
	Minimum Summary `json:"minimum"`
}

type ThdVoltageStat struct {
	ThdVRn Summary `json:"thd_vrn"`
	ThdVRs Summary `json:"thd_vrs"`
	ThdVRt Summary `json:"thd_vrt"`
	ThdVSn Summary `json:"thd_vsn"`
	ThdVSt Summary `json:"thd_vst"`
	ThdVTn Summary `json:"thd_vtn"`
}

type ThdCurrentStat struct {
	ThdIr Summary `json:"thd_ir"`
	ThdIs Summary `json:"thd_is"`
	ThdIt Summary `json:"thd_it"`
}

type VoltageStatistics struct {
	RN MetricSummary `json:"rn"`
	RS MetricSummary `json:"rs"`
	RT MetricSummary `json:"rt"`
	SN MetricSummary `json:"sn"`
	TN MetricSummary `json:"tn"`
	TS MetricSummary `json:"ts"`
}

type CurrentStatistics struct {
	IR MetricSummary `json:"ir"`
	IS MetricSummary `json:"is"`
	IT MetricSummary `json:"it"`
}

type ThdStatistics struct {
	Current ThdCurrentStat `json:"current"`
	Voltage ThdVoltageStat `json:"voltage"`
}

type FrequencyStatistics = MetricSummary

type PowerFactorStatistics struct {
	R     MetricSummary `json:"r"`
	S     MetricSummary `json:"s"`
	T     MetricSummary `json:"t"`
	Total MetricSummary `json:"total"`
}

type TppStatistics struct {
	R MetricSummary `json:"r"`
	S MetricSummary `json:"s"`
	T MetricSummary `json:"t"`

	IntoGrid Summary `json:"into_grid"`
	IntoLoad Summary `json:"into_load"`
}

type PowerStatistics struct {
	Active   TppStatistics `json:"active"`
	Reactive TppStatistics `json:"reactive"`
	Apparent TppStatistics `json:"apparent"`
}

type Statistics struct {
	Voltage     VoltageStatistics     `json:"voltage"`
	Current     CurrentStatistics     `json:"current"`
	Thd         ThdStatistics         `json:"thd"`
	Freq        FrequencyStatistics   `json:"freq"`
	PowerFactor PowerFactorStatistics `json:"power_factor"`
	Power       PowerStatistics       `json:"power"`
}
