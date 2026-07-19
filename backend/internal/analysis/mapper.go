package analysis

import "dta770/internal/analysis/models"

type FieldSetter func(*models.Record, float64)

var columnMap = map[string]FieldSetter{

	// =========================
	// Current
	// =========================

	"ir_cur": func(r *models.Record, v float64) { r.Current.R.Value = v },
	"ir_ave": func(r *models.Record, v float64) { r.Current.R.Average = v },
	"ir_max": func(r *models.Record, v float64) { r.Current.R.Maximum = v },
	"ir_min": func(r *models.Record, v float64) { r.Current.R.Minimum = v },

	"is_cur": func(r *models.Record, v float64) { r.Current.S.Value = v },
	"is_ave": func(r *models.Record, v float64) { r.Current.S.Average = v },
	"is_max": func(r *models.Record, v float64) { r.Current.S.Maximum = v },
	"is_min": func(r *models.Record, v float64) { r.Current.S.Minimum = v },

	"it_cur": func(r *models.Record, v float64) { r.Current.T.Value = v },
	"it_ave": func(r *models.Record, v float64) { r.Current.T.Average = v },
	"it_max": func(r *models.Record, v float64) { r.Current.T.Maximum = v },
	"it_min": func(r *models.Record, v float64) { r.Current.T.Minimum = v },

	// =========================
	// THD Current
	// =========================

	"thd_ir": func(r *models.Record, v float64) { r.THD.Current.ThdIr = v },
	"thd_is": func(r *models.Record, v float64) { r.THD.Current.ThdIs = v },
	"thd_it": func(r *models.Record, v float64) { r.THD.Current.ThdIt = v },

	// =========================
	// THD Voltage
	// =========================

	"thd_vrn": func(r *models.Record, v float64) { r.THD.Voltage.ThdVRn = v },
	"thd_vrs": func(r *models.Record, v float64) { r.THD.Voltage.ThdVRs = v },
	"thd_vrt": func(r *models.Record, v float64) { r.THD.Voltage.ThdVRt = v },
	"thd_vsn": func(r *models.Record, v float64) { r.THD.Voltage.ThdVSn = v },
	"thd_vtn": func(r *models.Record, v float64) { r.THD.Voltage.ThdVTn = v },
	"thd_vst": func(r *models.Record, v float64) { r.THD.Voltage.ThdVSt = v },

	// =========================
	// Frequency
	// =========================

	"frq_cur": func(r *models.Record, v float64) { r.Frequency.Value = v },
	"frq_ave": func(r *models.Record, v float64) { r.Frequency.Average = v },
	"frq_max": func(r *models.Record, v float64) { r.Frequency.Maximum = v },
	"frq_min": func(r *models.Record, v float64) { r.Frequency.Minimum = v },

	// =========================
	// Voltage RN
	// =========================

	"v_rn_cur": func(r *models.Record, v float64) { r.Voltage.RN.Value = v },
	"v_rn_ave": func(r *models.Record, v float64) { r.Voltage.RN.Average = v },
	"v_rn_max": func(r *models.Record, v float64) { r.Voltage.RN.Maximum = v },
	"v_rn_min": func(r *models.Record, v float64) { r.Voltage.RN.Minimum = v },

	// =========================
	// Voltage RS
	// =========================

	"v_rs_cur": func(r *models.Record, v float64) { r.Voltage.RS.Value = v },
	"v_rs_ave": func(r *models.Record, v float64) { r.Voltage.RS.Average = v },
	"v_rs_max": func(r *models.Record, v float64) { r.Voltage.RS.Maximum = v },
	"v_rs_min": func(r *models.Record, v float64) { r.Voltage.RS.Minimum = v },

	// =========================
	// Voltage RT
	// =========================

	"v_rt_cur": func(r *models.Record, v float64) { r.Voltage.RT.Value = v },
	"v_rt_ave": func(r *models.Record, v float64) { r.Voltage.RT.Average = v },
	"v_rt_max": func(r *models.Record, v float64) { r.Voltage.RT.Maximum = v },
	"v_rt_min": func(r *models.Record, v float64) { r.Voltage.RT.Minimum = v },

	// =========================
	// Voltage SN
	// =========================

	"v_sn_cur": func(r *models.Record, v float64) { r.Voltage.SN.Value = v },
	"v_sn_ave": func(r *models.Record, v float64) { r.Voltage.SN.Average = v },
	"v_sn_max": func(r *models.Record, v float64) { r.Voltage.SN.Maximum = v },
	"v_sn_min": func(r *models.Record, v float64) { r.Voltage.SN.Minimum = v },

	// =========================
	// Voltage TN
	// =========================

	"v_tn_cur": func(r *models.Record, v float64) { r.Voltage.TN.Value = v },
	"v_tn_ave": func(r *models.Record, v float64) { r.Voltage.TN.Average = v },
	"v_tn_max": func(r *models.Record, v float64) { r.Voltage.TN.Maximum = v },
	"v_tn_min": func(r *models.Record, v float64) { r.Voltage.TN.Minimum = v },

	// =========================
	// Voltage TS
	// =========================

	"v_ts_cur": func(r *models.Record, v float64) { r.Voltage.TS.Value = v },
	"v_ts_ave": func(r *models.Record, v float64) { r.Voltage.TS.Average = v },
	"v_ts_max": func(r *models.Record, v float64) { r.Voltage.TS.Maximum = v },
	"v_ts_min": func(r *models.Record, v float64) { r.Voltage.TS.Minimum = v },

	// =========================
	// Power Factor
	// =========================

	"cos_r_cur": func(r *models.Record, v float64) { r.PowerFactor.R.Value = v },
	"cos_r_ave": func(r *models.Record, v float64) { r.PowerFactor.R.Average = v },
	"cos_r_max": func(r *models.Record, v float64) { r.PowerFactor.R.Maximum = v },
	"cos_r_min": func(r *models.Record, v float64) { r.PowerFactor.R.Minimum = v },

	"cos_s_cur": func(r *models.Record, v float64) { r.PowerFactor.S.Value = v },
	"cos_s_ave": func(r *models.Record, v float64) { r.PowerFactor.S.Average = v },
	"cos_s_max": func(r *models.Record, v float64) { r.PowerFactor.S.Maximum = v },
	"cos_s_min": func(r *models.Record, v float64) { r.PowerFactor.S.Minimum = v },

	"cos_t_cur": func(r *models.Record, v float64) { r.PowerFactor.T.Value = v },
	"cos_t_ave": func(r *models.Record, v float64) { r.PowerFactor.T.Average = v },
	"cos_t_max": func(r *models.Record, v float64) { r.PowerFactor.T.Maximum = v },
	"cos_t_min": func(r *models.Record, v float64) { r.PowerFactor.T.Minimum = v },

	"cos_total_cur": func(r *models.Record, v float64) { r.PowerFactor.Total.Value = v },
	"cos_total_ave": func(r *models.Record, v float64) { r.PowerFactor.Total.Average = v },
	"cos_total_max": func(r *models.Record, v float64) { r.PowerFactor.Total.Maximum = v },
	"cos_total_min": func(r *models.Record, v float64) { r.PowerFactor.Total.Minimum = v },

	// =========================
	// Active Power
	// =========================

	"p_act_r_cur": func(r *models.Record, v float64) { r.Power.Active.R.Value = v },
	"p_act_r_ave": func(r *models.Record, v float64) { r.Power.Active.R.Average = v },
	"p_act_r_max": func(r *models.Record, v float64) { r.Power.Active.R.Maximum = v },
	"p_act_r_min": func(r *models.Record, v float64) { r.Power.Active.R.Minimum = v },

	"p_act_s_cur": func(r *models.Record, v float64) { r.Power.Active.S.Value = v },
	"p_act_s_ave": func(r *models.Record, v float64) { r.Power.Active.S.Average = v },
	"p_act_s_max": func(r *models.Record, v float64) { r.Power.Active.S.Maximum = v },
	"p_act_s_min": func(r *models.Record, v float64) { r.Power.Active.S.Minimum = v },

	"p_act_t_cur": func(r *models.Record, v float64) { r.Power.Active.T.Value = v },
	"p_act_t_ave": func(r *models.Record, v float64) { r.Power.Active.T.Average = v },
	"p_act_t_max": func(r *models.Record, v float64) { r.Power.Active.T.Maximum = v },
	"p_act_t_min": func(r *models.Record, v float64) { r.Power.Active.T.Minimum = v },

	"p_act_into_grid": func(r *models.Record, v float64) { r.Power.Active.IntoGrid = v },
	"p_act_into_load": func(r *models.Record, v float64) { r.Power.Active.IntoLoad = v },

	// =========================
	// Reactive Power
	// =========================

	"p_ract_r_cur": func(r *models.Record, v float64) { r.Power.Reactive.R.Value = v },
	"p_ract_r_ave": func(r *models.Record, v float64) { r.Power.Reactive.R.Average = v },
	"p_ract_r_max": func(r *models.Record, v float64) { r.Power.Reactive.R.Maximum = v },
	"p_ract_r_min": func(r *models.Record, v float64) { r.Power.Reactive.R.Minimum = v },

	"p_ract_s_cur": func(r *models.Record, v float64) { r.Power.Reactive.S.Value = v },
	"p_ract_s_ave": func(r *models.Record, v float64) { r.Power.Reactive.S.Average = v },
	"p_ract_s_max": func(r *models.Record, v float64) { r.Power.Reactive.S.Maximum = v },
	"p_ract_s_min": func(r *models.Record, v float64) { r.Power.Reactive.S.Minimum = v },

	"p_ract_t_cur": func(r *models.Record, v float64) { r.Power.Reactive.T.Value = v },
	"p_ract_t_ave": func(r *models.Record, v float64) { r.Power.Reactive.T.Average = v },
	"p_ract_t_max": func(r *models.Record, v float64) { r.Power.Reactive.T.Maximum = v },
	"p_ract_t_min": func(r *models.Record, v float64) { r.Power.Reactive.T.Minimum = v },

	"p_ract_into_grid": func(r *models.Record, v float64) { r.Power.Reactive.IntoGrid = v },
	"p_ract_into_load": func(r *models.Record, v float64) { r.Power.Reactive.IntoLoad = v },

	// =========================
	// Apparent Power
	// =========================

	"p_apparent_r_cur": func(r *models.Record, v float64) { r.Power.Apparent.R.Value = v },
	"p_apparent_r_ave": func(r *models.Record, v float64) { r.Power.Apparent.R.Average = v },
	"p_apparent_r_max": func(r *models.Record, v float64) { r.Power.Apparent.R.Maximum = v },
	"p_apparent_r_min": func(r *models.Record, v float64) { r.Power.Apparent.R.Minimum = v },

	"p_apparent_s_cur": func(r *models.Record, v float64) { r.Power.Apparent.S.Value = v },
	"p_apparent_s_ave": func(r *models.Record, v float64) { r.Power.Apparent.S.Average = v },
	"p_apparent_s_max": func(r *models.Record, v float64) { r.Power.Apparent.S.Maximum = v },
	"p_apparent_s_min": func(r *models.Record, v float64) { r.Power.Apparent.S.Minimum = v },

	"p_apparent_t_cur": func(r *models.Record, v float64) { r.Power.Apparent.T.Value = v },
	"p_apparent_t_ave": func(r *models.Record, v float64) { r.Power.Apparent.T.Average = v },
	"p_apparent_t_max": func(r *models.Record, v float64) { r.Power.Apparent.T.Maximum = v },
	"p_apparent_t_min": func(r *models.Record, v float64) { r.Power.Apparent.T.Minimum = v },

	"p_apparent_into_grid": func(r *models.Record, v float64) { r.Power.Apparent.IntoGrid = v },
	"p_apparent_into_load": func(r *models.Record, v float64) { r.Power.Apparent.IntoLoad = v },
}
