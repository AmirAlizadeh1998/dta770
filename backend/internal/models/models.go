package models

import (
	"encoding/json"
	"time"
)

type User struct {
	Id        int    `json:"id"`
	UserName  string `json:"user_name"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Password  string `json:"password"`
	Mobile    string `json:"mobile"`
	RoleId    int    `json:"role_id"`
	Status    string `json:"status"`
	RoleName  string `json:"role_name,omitempty"`
}

type LoginRequest struct {
	UserName string `json:"user_name"`
	Password string `json:"password"`
}

type Device struct {
	Id                int    `json:"id"`
	DeviceName        string `json:"device_name"`
	OwnerName         string `json:"owner_name"`
	DeviceCode        string `json:"device_code"`
	Imei              string `json:"imei"`
	Phone             string `json:"phone"`
	Address           string `json:"address"`
	FuseBox           bool   `json:"fuse_box"`
	NullConnection    bool   `json:"null_connection"`
	FuseComb          bool   `json:"fuse_comb"`
	LineBalance       bool   `json:"line_balance"`
	UnitEarth         bool   `json:"unit_earth"`
	UpsBattery        bool   `json:"ups_battery"`
	DistanceFromTrans string `json:"distance_from_trans"`
	CableSize         string `json:"cable_size"`
	ThreePhase        bool   `json:"three_phase"`
	Materials         string `json:"materials"`
	Description       string `json:"description"`
	IsActive          bool   `json:"is_active"`
	StartTime         string `json:"start_time"`
	EndTime           string `json:"end_time"`
	LastSeenAt        string `json:"last_seen_at"`
	Alarm             string `json:"alarm"`
}

type Logs struct {
	Id        int             `json:"id"`
	CreatedAt time.Time       `json:"created_at"`
	Data      json.RawMessage `json:"data"`
	IMEI      string          `json:"imei"`
}

type FlexString string

func (fs *FlexString) UnmarshalJSON(b []byte) error {
	if len(b) > 0 && b[0] == '"' {
		// اگه با کوتیشن شروع شده یعنی رشته است
		var s string
		if err := json.Unmarshal(b, &s); err != nil {
			return err
		}
		*fs = FlexString(s)
	} else {
		// اگه کوتیشن نداره یعنی عدد (یا چیز دیگه‌ای) هست، مستقیم همون رو رشته در نظر می‌گیریم
		*fs = FlexString(b)
	}
	return nil
}

type LogData struct {
	IMEI              FlexString `json:"IMEI"`
	Acin              FlexString `json:"acin"`
	Model             FlexString `json:"model"`
	IrAve             FlexString `json:"ir_ave"`
	IrCur             FlexString `json:"ir_cur"`
	IrMax             FlexString `json:"ir_max"`
	IrMin             FlexString `json:"ir_min"`
	IsAve             FlexString `json:"is_ave"`
	IsCur             FlexString `json:"is_cur"`
	IsMax             FlexString `json:"is_max"`
	IsMin             FlexString `json:"is_min"`
	ItAve             FlexString `json:"it_ave"`
	ItCur             FlexString `json:"it_cur"`
	ItMax             FlexString `json:"it_max"`
	ItMin             FlexString `json:"it_min"`
	ThdIr             FlexString `json:"thd_ir"`
	ThdIs             FlexString `json:"thd_is"`
	ThdIt             FlexString `json:"thd_it"`
	FrqAve            FlexString `json:"frq_ave"`
	FrqCur            FlexString `json:"frq_cur"`
	FrqMax            FlexString `json:"frq_max"`
	FrqMin            FlexString `json:"frq_min"`
	ThdVrn            FlexString `json:"thd_vrn"`
	ThdVrs            FlexString `json:"thd_vrs"`
	ThdVrt            FlexString `json:"thd_vrt"`
	ThdVsn            FlexString `json:"thd_vsn"`
	ThdVst            FlexString `json:"thd_vst"`
	ThdVtn            FlexString `json:"thd_vtn"`
	VRnAve            FlexString `json:"v_rn_ave"`
	VRnCur            FlexString `json:"v_rn_cur"`
	VRnMax            FlexString `json:"v_rn_max"`
	VRnMin            FlexString `json:"v_rn_min"`
	VRsAve            FlexString `json:"v_rs_ave"`
	VRsCur            FlexString `json:"v_rs_cur"`
	VRsMax            FlexString `json:"v_rs_max"`
	VRsMin            FlexString `json:"v_rs_min"`
	VRtAve            FlexString `json:"v_rt_ave"`
	VRtCur            FlexString `json:"v_rt_cur"`
	VRtMax            FlexString `json:"v_rt_max"`
	VRtMin            FlexString `json:"v_rt_min"`
	VSnAve            FlexString `json:"v_sn_ave"`
	VSnCur            FlexString `json:"v_sn_cur"`
	VSnMax            FlexString `json:"v_sn_max"`
	VSnMin            FlexString `json:"v_sn_min"`
	VTnAve            FlexString `json:"v_tn_ave"`
	VTnCur            FlexString `json:"v_tn_cur"`
	VTnMax            FlexString `json:"v_tn_max"`
	VTnMin            FlexString `json:"v_tn_min"`
	VTsAve            FlexString `json:"v_ts_ave"`
	VTsCur            FlexString `json:"v_ts_cur"`
	VTsMax            FlexString `json:"v_ts_max"`
	VTsMin            FlexString `json:"v_ts_min"`
	CosRAve           FlexString `json:"cos_r_ave"`
	CosRCur           FlexString `json:"cos_r_cur"`
	CosRMax           FlexString `json:"cos_r_max"`
	CosRMin           FlexString `json:"cos_r_min"`
	CosSAve           FlexString `json:"cos_s_ave"`
	CosSCur           FlexString `json:"cos_s_cur"`
	CosSMax           FlexString `json:"cos_s_max"`
	CosSMin           FlexString `json:"cos_s_min"`
	CosTAve           FlexString `json:"cos_t_ave"`
	CosTCur           FlexString `json:"cos_t_cur"`
	CosTMax           FlexString `json:"cos_t_max"`
	CosTMin           FlexString `json:"cos_t_min"`
	WorkClock         FlexString `json:"work_clock"`
	CustomerID        FlexString `json:"customer_id"`
	PActRAve          FlexString `json:"p_act_r_ave"`
	PActRCur          FlexString `json:"p_act_r_cur"`
	PActRMax          FlexString `json:"p_act_r_max"`
	PActRMin          FlexString `json:"p_act_r_min"`
	PActSAve          FlexString `json:"p_act_s_ave"`
	PActSCur          FlexString `json:"p_act_s_cur"`
	PActSMax          FlexString `json:"p_act_s_max"`
	PActSMin          FlexString `json:"p_act_s_min"`
	PActTAve          FlexString `json:"p_act_t_ave"`
	PActTCur          FlexString `json:"p_act_t_cur"`
	PActTMax          FlexString `json:"p_act_t_max"`
	PActTMin          FlexString `json:"p_act_t_min"`
	SigQuality        FlexString `json:"sig_quality"`
	Harmonic1R        FlexString `json:"harmonic_1_R"`
	Harmonic1S        FlexString `json:"harmonic_1_S"`
	Harmonic1T        FlexString `json:"harmonic_1_T"`
	Harmonic2R        FlexString `json:"harmonic_2_R"`
	Harmonic2S        FlexString `json:"harmonic_2_S"`
	Harmonic2T        FlexString `json:"harmonic_2_T"`
	Harmonic3R        FlexString `json:"harmonic_3_R"`
	Harmonic3S        FlexString `json:"harmonic_3_S"`
	Harmonic3T        FlexString `json:"harmonic_3_T"`
	Harmonic4R        FlexString `json:"harmonic_4_R"`
	Harmonic4S        FlexString `json:"harmonic_4_S"`
	Harmonic4T        FlexString `json:"harmonic_4_T"`
	Harmonic5R        FlexString `json:"harmonic_5_R"`
	Harmonic5S        FlexString `json:"harmonic_5_S"`
	Harmonic5T        FlexString `json:"harmonic_5_T"`
	Harmonic6R        FlexString `json:"harmonic_6_R"`
	Harmonic6S        FlexString `json:"harmonic_6_S"`
	Harmonic6T        FlexString `json:"harmonic_6_T"`
	Harmonic7R        FlexString `json:"harmonic_7_R"`
	Harmonic7S        FlexString `json:"harmonic_7_S"`
	Harmonic7T        FlexString `json:"harmonic_7_T"`
	Harmonic8R        FlexString `json:"harmonic_8_R"`
	Harmonic8S        FlexString `json:"harmonic_8_S"`
	Harmonic8T        FlexString `json:"harmonic_8_T"`
	Harmonic9R        FlexString `json:"harmonic_9_R"`
	Harmonic9S        FlexString `json:"harmonic_9_S"`
	Harmonic9T        FlexString `json:"harmonic_9_T"`
	PRactRAve         FlexString `json:"p_ract_r_ave"`
	PRactRCur         FlexString `json:"p_ract_r_cur"`
	PRactRMax         FlexString `json:"p_ract_r_max"`
	PRactRMin         FlexString `json:"p_ract_r_min"`
	PRactSAve         FlexString `json:"p_ract_s_ave"`
	PRactSCur         FlexString `json:"p_ract_s_cur"`
	PRactSMax         FlexString `json:"p_ract_s_max"`
	PRactSMin         FlexString `json:"p_ract_s_min"`
	PRactTAve         FlexString `json:"p_ract_t_ave"`
	PRactTCur         FlexString `json:"p_ract_t_cur"`
	PRactTMax         FlexString `json:"p_ract_t_max"`
	PRactTMin         FlexString `json:"p_ract_t_min"`
	CosTotalAve       FlexString `json:"cos_total_ave"`
	CosTotalCur       FlexString `json:"cos_total_cur"`
	CosTotalMax       FlexString `json:"cos_total_max"`
	CosTotalMin       FlexString `json:"cos_total_min"`
	Harmonic10R       FlexString `json:"harmonic_10_R"`
	Harmonic10S       FlexString `json:"harmonic_10_S"`
	Harmonic10T       FlexString `json:"harmonic_10_T"`
	Harmonic11R       FlexString `json:"harmonic_11_R"`
	Harmonic11S       FlexString `json:"harmonic_11_S"`
	Harmonic11T       FlexString `json:"harmonic_11_T"`
	Harmonic12R       FlexString `json:"harmonic_12_R"`
	Harmonic12S       FlexString `json:"harmonic_12_S"`
	Harmonic12T       FlexString `json:"harmonic_12_T"`
	Harmonic13R       FlexString `json:"harmonic_13_R"`
	Harmonic13S       FlexString `json:"harmonic_13_S"`
	Harmonic13T       FlexString `json:"harmonic_13_T"`
	Harmonic14R       FlexString `json:"harmonic_14_R"`
	Harmonic14S       FlexString `json:"harmonic_14_S"`
	Harmonic14T       FlexString `json:"harmonic_14_T"`
	Harmonic15R       FlexString `json:"harmonic_15_R"`
	Harmonic15S       FlexString `json:"harmonic_15_S"`
	Harmonic15T       FlexString `json:"harmonic_15_T"`
	PActIntoGrid      FlexString `json:"p_act_into_grid"`
	PActIntoLoad      FlexString `json:"p_act_into_load"`
	PApparentRAve     FlexString `json:"p_apparent_r_ave"`
	PApparentRCur     FlexString `json:"p_apparent_r_cur"`
	PApparentRMax     FlexString `json:"p_apparent_r_max"`
	PApparentRMin     FlexString `json:"p_apparent_r_min"`
	PApparentSAve     FlexString `json:"p_apparent_s_ave"`
	PApparentSCur     FlexString `json:"p_apparent_s_cur"`
	PApparentSMax     FlexString `json:"p_apparent_s_max"`
	PApparentSMin     FlexString `json:"p_apparent_s_min"`
	PApparentTAve     FlexString `json:"p_apparent_t_ave"`
	PApparentTCur     FlexString `json:"p_apparent_t_cur"`
	PApparentTMax     FlexString `json:"p_apparent_t_max"`
	PApparentTMin     FlexString `json:"p_apparent_t_min"`
	PRactIntoGrid     FlexString `json:"p_ract_into_grid"`
	PRactIntoLoad     FlexString `json:"p_ract_into_load"`
	PApparentIntoGrid FlexString `json:"p_apparent_into_grid"`
	PApparentIntoLoad FlexString `json:"p_apparent_into_load"`
}

type DeviceDetailsResponse struct {
	IMEI              string            `json:"imei"`
	DeviceName        string            `json:"device_name"`
	Data              map[string]string `json:"data"`
	CreatedAt         time.Time         `json:"created_at"`
	StartTime         *time.Time        `json:"start_time"`
	EndTime           *time.Time        `json:"end_time"`
	LastValidDataTime *time.Time        `json:"last_valid_data_time"`
	Alarm             json.RawMessage   `json:"alarm,omitempty"`
}
