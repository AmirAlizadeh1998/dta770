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
	Imei              string `json:"imei"`
	Phone             string `json:"phone"`
	Address           string `json:"address"`
	Longitude         string `json:"longitude"`
	Latitude          string `json:"latitude"`
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
	VoiceNotePath     string `json:"voice_note_path"`
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

type LogData struct {
	IMEI              string `json:"IMEI"`
	Acin              string `json:"acin"`
	Model             string `json:"model"`
	IrAve             string `json:"ir_ave"`
	IrCur             string `json:"ir_cur"`
	IrMax             string `json:"ir_max"`
	IrMin             string `json:"ir_min"`
	IsAve             string `json:"is_ave"`
	IsCur             string `json:"is_cur"`
	IsMax             string `json:"is_max"`
	IsMin             string `json:"is_min"`
	ItAve             string `json:"it_ave"`
	ItCur             string `json:"it_cur"`
	ItMax             string `json:"it_max"`
	ItMin             string `json:"it_min"`
	ThdIr             string `json:"thd_ir"`
	ThdIs             string `json:"thd_is"`
	ThdIt             string `json:"thd_it"`
	FrqAve            string `json:"frq_ave"`
	FrqCur            string `json:"frq_cur"`
	FrqMax            string `json:"frq_max"`
	FrqMin            string `json:"frq_min"`
	ThdVrn            string `json:"thd_vrn"`
	ThdVrs            string `json:"thd_vrs"`
	ThdVrt            string `json:"thd_vrt"`
	ThdVsn            string `json:"thd_vsn"`
	ThdVst            string `json:"thd_vst"`
	ThdVtn            string `json:"thd_vtn"`
	VRnAve            string `json:"v_rn_ave"`
	VRnCur            string `json:"v_rn_cur"`
	VRnMax            string `json:"v_rn_max"`
	VRnMin            string `json:"v_rn_min"`
	VRsAve            string `json:"v_rs_ave"`
	VRsCur            string `json:"v_rs_cur"`
	VRsMax            string `json:"v_rs_max"`
	VRsMin            string `json:"v_rs_min"`
	VRtAve            string `json:"v_rt_ave"`
	VRtCur            string `json:"v_rt_cur"`
	VRtMax            string `json:"v_rt_max"`
	VRtMin            string `json:"v_rt_min"`
	VSnAve            string `json:"v_sn_ave"`
	VSnCur            string `json:"v_sn_cur"`
	VSnMax            string `json:"v_sn_max"`
	VSnMin            string `json:"v_sn_min"`
	VTnAve            string `json:"v_tn_ave"`
	VTnCur            string `json:"v_tn_cur"`
	VTnMax            string `json:"v_tn_max"`
	VTnMin            string `json:"v_tn_min"`
	VTsAve            string `json:"v_ts_ave"`
	VTsCur            string `json:"v_ts_cur"`
	VTsMax            string `json:"v_ts_max"`
	VTsMin            string `json:"v_ts_min"`
	CosRAve           string `json:"cos_r_ave"`
	CosRCur           string `json:"cos_r_cur"`
	CosRMax           string `json:"cos_r_max"`
	CosRMin           string `json:"cos_r_min"`
	CosSAve           string `json:"cos_s_ave"`
	CosSCur           string `json:"cos_s_cur"`
	CosSMax           string `json:"cos_s_max"`
	CosSMin           string `json:"cos_s_min"`
	CosTAve           string `json:"cos_t_ave"`
	CosTCur           string `json:"cos_t_cur"`
	CosTMax           string `json:"cos_t_max"`
	CosTMin           string `json:"cos_t_min"`
	WorkClock         string `json:"work_clock"`
	CustomerID        string `json:"customer_id"`
	PActRAve          string `json:"p_act_r_ave"`
	PActRCur          string `json:"p_act_r_cur"`
	PActRMax          string `json:"p_act_r_max"`
	PActRMin          string `json:"p_act_r_min"`
	PActSAve          string `json:"p_act_s_ave"`
	PActSCur          string `json:"p_act_s_cur"`
	PActSMax          string `json:"p_act_s_max"`
	PActSMin          string `json:"p_act_s_min"`
	PActTAve          string `json:"p_act_t_ave"`
	PActTCur          string `json:"p_act_t_cur"`
	PActTMax          string `json:"p_act_t_max"`
	PActTMin          string `json:"p_act_t_min"`
	SigQuality        string `json:"sig_quality"`
	Harmonic1R        string `json:"harmonic_1_R"`
	Harmonic1S        string `json:"harmonic_1_S"`
	Harmonic1T        string `json:"harmonic_1_T"`
	Harmonic2R        string `json:"harmonic_2_R"`
	Harmonic2S        string `json:"harmonic_2_S"`
	Harmonic2T        string `json:"harmonic_2_T"`
	Harmonic3R        string `json:"harmonic_3_R"`
	Harmonic3S        string `json:"harmonic_3_S"`
	Harmonic3T        string `json:"harmonic_3_T"`
	Harmonic4R        string `json:"harmonic_4_R"`
	Harmonic4S        string `json:"harmonic_4_S"`
	Harmonic4T        string `json:"harmonic_4_T"`
	Harmonic5R        string `json:"harmonic_5_R"`
	Harmonic5S        string `json:"harmonic_5_S"`
	Harmonic5T        string `json:"harmonic_5_T"`
	Harmonic6R        string `json:"harmonic_6_R"`
	Harmonic6S        string `json:"harmonic_6_S"`
	Harmonic6T        string `json:"harmonic_6_T"`
	Harmonic7R        string `json:"harmonic_7_R"`
	Harmonic7S        string `json:"harmonic_7_S"`
	Harmonic7T        string `json:"harmonic_7_T"`
	Harmonic8R        string `json:"harmonic_8_R"`
	Harmonic8S        string `json:"harmonic_8_S"`
	Harmonic8T        string `json:"harmonic_8_T"`
	Harmonic9R        string `json:"harmonic_9_R"`
	Harmonic9S        string `json:"harmonic_9_S"`
	Harmonic9T        string `json:"harmonic_9_T"`
	PRactRAve         string `json:"p_ract_r_ave"`
	PRactRCur         string `json:"p_ract_r_cur"`
	PRactRMax         string `json:"p_ract_r_max"`
	PRactRMin         string `json:"p_ract_r_min"`
	PRactSAve         string `json:"p_ract_s_ave"`
	PRactSCur         string `json:"p_ract_s_cur"`
	PRactSMax         string `json:"p_ract_s_max"`
	PRactSMin         string `json:"p_ract_s_min"`
	PRactTAve         string `json:"p_ract_t_ave"`
	PRactTCur         string `json:"p_ract_t_cur"`
	PRactTMax         string `json:"p_ract_t_max"`
	PRactTMin         string `json:"p_ract_t_min"`
	CosTotalAve       string `json:"cos_total_ave"`
	CosTotalCur       string `json:"cos_total_cur"`
	CosTotalMax       string `json:"cos_total_max"`
	CosTotalMin       string `json:"cos_total_min"`
	Harmonic10R       string `json:"harmonic_10_R"`
	Harmonic10S       string `json:"harmonic_10_S"`
	Harmonic10T       string `json:"harmonic_10_T"`
	Harmonic11R       string `json:"harmonic_11_R"`
	Harmonic11S       string `json:"harmonic_11_S"`
	Harmonic11T       string `json:"harmonic_11_T"`
	Harmonic12R       string `json:"harmonic_12_R"`
	Harmonic12S       string `json:"harmonic_12_S"`
	Harmonic12T       string `json:"harmonic_12_T"`
	Harmonic13R       string `json:"harmonic_13_R"`
	Harmonic13S       string `json:"harmonic_13_S"`
	Harmonic13T       string `json:"harmonic_13_T"`
	Harmonic14R       string `json:"harmonic_14_R"`
	Harmonic14S       string `json:"harmonic_14_S"`
	Harmonic14T       string `json:"harmonic_14_T"`
	Harmonic15R       string `json:"harmonic_15_R"`
	Harmonic15S       string `json:"harmonic_15_S"`
	Harmonic15T       string `json:"harmonic_15_T"`
	PActIntoGrid      string `json:"p_act_into_grid"`
	PActIntoLoad      string `json:"p_act_into_load"`
	PApparentRAve     string `json:"p_apparent_r_ave"`
	PApparentRCur     string `json:"p_apparent_r_cur"`
	PApparentRMax     string `json:"p_apparent_r_max"`
	PApparentRMin     string `json:"p_apparent_r_min"`
	PApparentSAve     string `json:"p_apparent_s_ave"`
	PApparentSCur     string `json:"p_apparent_s_cur"`
	PApparentSMax     string `json:"p_apparent_s_max"`
	PApparentSMin     string `json:"p_apparent_s_min"`
	PApparentTAve     string `json:"p_apparent_t_ave"`
	PApparentTCur     string `json:"p_apparent_t_cur"`
	PApparentTMax     string `json:"p_apparent_t_max"`
	PApparentTMin     string `json:"p_apparent_t_min"`
	PRactIntoGrid     string `json:"p_ract_into_grid"`
	PRactIntoLoad     string `json:"p_ract_into_load"`
	PApparentIntoGrid string `json:"p_apparent_into_grid"`
	PApparentIntoLoad string `json:"p_apparent_into_load"`
}

type DeviceDetailsResponse struct {
	IMEI              string          `json:"imei"`
	Data              LogData         `json:"data"`
	CreatedAt         time.Time       `json:"created_at"`
	StartTime         *time.Time      `json:"start_time"`
	EndTime           *time.Time      `json:"end_time"`
	LastValidDataTime *time.Time      `json:"last_valid_data_time"`
	Alarm             json.RawMessage `json:"alarm,omitempty"`
}
