package models

// Metric یک پارامتر اندازه‌گیری شده (Current / Avg / Max / Min)
type Metric struct {
	Value   float64 `json:"value"`
	Average float64 `json:"average"`
	Maximum float64 `json:"maximum"`
	Minimum float64 `json:"minimum"`
}

// ---------------- Voltage ----------------

// Voltage ولتاژهای اندازه‌گیری شده
// مطابق ستون‌های فایل:
// v_rn_*, v_rs_*, v_rt_*,
// v_sn_*, v_tn_*, v_ts_*
type Voltage struct {
	RN Metric `json:"rn"`
	RS Metric `json:"rs"`
	RT Metric `json:"rt"`

	SN Metric `json:"sn"`

	TN Metric `json:"tn"`
	TS Metric `json:"ts"`
}

// ---------------- Current ----------------

// Current جریان هر فاز
// ir_*
// is_*
// it_*
type Current struct {
	R Metric `json:"r"`
	S Metric `json:"s"`
	T Metric `json:"t"`
}

// ---------------- Frequency ----------------

type Frequency = Metric

// ---------------- Power Factor ----------------

type PowerFactor struct {
	R     Metric `json:"r"`
	S     Metric `json:"s"`
	T     Metric `json:"t"`
	Total Metric `json:"total"`
}

// ---------------- Power ----------------

type ThreePhasePower struct {
	R Metric `json:"r"`
	S Metric `json:"s"`
	T Metric `json:"t"`

	IntoGrid float64 `json:"into_grid"`
	IntoLoad float64 `json:"into_load"`
}

type Power struct {
	Active   ThreePhasePower `json:"active"`
	Reactive ThreePhasePower `json:"reactive"`
	Apparent ThreePhasePower `json:"apparent"`
}

// ---------------- THD ----------------

type ThdCurrent struct {
	ThdIr float64 `json:"thd_ir"`
	ThdIs float64 `json:"thd_is"`
	ThdIt float64 `json:"thd_it"`
}

type ThdVoltage struct {
	ThdVRn float64 `json:"thd_vrn"`
	ThdVRs float64 `json:"thd_vrs"`
	ThdVRt float64 `json:"thd_vrt"`
	ThdVSn float64 `json:"thd_vsn"`
	ThdVSt float64 `json:"thd_vst"`
	ThdVTn float64 `json:"thd_vtn"`
}

type THD struct {
	Current ThdCurrent `json:"current"`
	Voltage ThdVoltage `json:"voltage"`
}

// ---------------- Record ----------------

type Record struct {
	Timestamp string `json:"timestamp"`

	Voltage Voltage `json:"voltage"`
	Current Current `json:"current"`

	Frequency Frequency `json:"frequency"`

	Power Power `json:"power"`

	PowerFactor PowerFactor `json:"power_factor"`

	THD THD `json:"thd"`

	// سایر ستون‌هایی که فعلاً مدل نشده‌اند
	Extra map[string]float64 `json:"extra"`

	// مقدار خام هر ستون (برای دیباگ)
	Raw map[string]string `json:"raw,omitempty"`
}
