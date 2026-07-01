export const TABS = [
    {id: 'basic', label: 'اطلاعات پایه'},
    {id: 'voltage', label: 'ولتاژ'},
    {id: 'current', label: 'جریان'},
    {id: 'power', label: 'توان و انرژی'},
    {id: 'frequency', label: 'فرکانس و هارمونیک‌ها'}
];

export const VOLTAGE_CARDS = [
    {title: 'ولتاژ فاز به نول (R)',
        items: [{label: 'حداکثر ولتاژ فاز R-N', key: 'v_rn_max'}, {
            label: 'میانگین ولتاژ فاز R-N',
            key: 'v_rn_ave'
        }, {label: 'حداقل ولتاژ فاز R-N', key: 'v_rn_min'}, {label: 'ولتاژ فعلی فاز R-N', key: 'v_rn_cur'}]
    },
    {title: 'ولتاژ فاز به نول (S)',
        items: [{label: 'حداکثر ولتاژ فاز S-N', key: 'v_sn_max'}, {
            label: 'میانگین ولتاژ فاز S-N',
            key: 'v_sn_ave'
        }, {label: 'حداقل ولتاژ فاز S-N', key: 'v_sn_min'}, {label: 'ولتاژ فعلی فاز S-N', key: 'v_sn_cur'}]
    },
    {title: 'ولتاژ فاز به نول (T)',
        items: [{label: 'حداکثر ولتاژ فاز T-N', key: 'v_tn_max'}, {
            label: 'میانگین ولتاژ فاز T-N',
            key: 'v_tn_ave'
        }, {label: 'حداقل ولتاژ فاز T-N', key: 'v_tn_min'}, {label: 'ولتاژ فعلی فاز T-N', key: 'v_tn_cur'}]
    },
    {title: 'ولتاژ فاز به فاز (RS)',
        items: [{label: 'حداکثر ولتاژ خط RS', key: 'v_rs_max'}, {
            label: 'میانگین ولتاژ خط RS',
            key: 'v_rs_ave'
        }, {label: 'حداقل ولتاژ خط RS', key: 'v_rs_min'}, {label: 'ولتاژ فعلی خط RS', key: 'v_rs_cur'}]
    },
    {title: 'ولتاژ فاز به فاز (RT)',
        items: [{label: 'حداکثر ولتاژ خط RT', key: 'v_rt_max'}, {
            label: 'میانگین ولتاژ خط RT',
            key: 'v_rt_ave'
        }, {label: 'حداقل ولتاژ خط RT', key: 'v_rt_min'}, {label: 'ولتاژ فعلی خط RT', key: 'v_rt_cur'}]
    },
    {title: 'ولتاژ فاز به فاز (ST)',
        items: [{label: 'حداکثر ولتاژ خط TS', key: 'v_ts_max'}, {
            label: 'میانگین ولتاژ خط TS',
            key: 'v_ts_ave'
        }, {label: 'حداقل ولتاژ خط TS', key: 'v_ts_min'}, {label: 'ولتاژ فعلی خط TS', key: 'v_ts_cur'}]
    }
];

export const CURRENT_CARDS = [
    {title: 'جریان فاز (R)',
        items: [
            {label: 'حداکثر جریان فاز R', key: 'ir_max'},
            {label: 'میانگین جریان فاز R', key: 'ir_ave'},
            {label: 'حداقل جریان فاز R', key: 'ir_min'},
            {label: 'جریان فعلی فاز R', key: 'ir_cur'}
        ]
    },
    {title: 'جریان فاز (S)',
        items: [
            {label: 'حداکثر جریان فاز S', key: 'is_max'},
            {label: 'میانگین جریان فاز S', key: 'is_ave'},
            {label: 'حداقل جریان فاز S', key: 'is_min'},
            {label: 'جریان فعلی فاز S', key: 'is_cur'}
        ]
    },
    {title: 'جریان فاز (T)',
        items: [
            {label: 'حداکثر جریان فاز T', key: 'it_max'},
            {label: 'میانگین جریان فاز T', key: 'it_ave'},
            {label: 'حداقل جریان فاز T', key: 'it_min'},
            {label: 'جریان فعلی فاز T', key: 'it_cur'}
        ]
    },
];

export const POWER_CARDS = [
    {
        title: 'توان اکتیو',
        unit: 'kW',
        items: [
            {label: 'حداکثر توان اکتیو فاز R', key: 'p_act_r_max'},
            {label: 'میانگین توان اکتیو فاز R', key: 'p_act_r_ave'},
            {label: 'حداقل توان اکتیو فاز R', key: 'p_act_r_min'},
            {label: 'توان اکتیو فعلی فاز R', key: 'p_act_r_cur'},
            {label: 'حداکثر توان اکتیو فاز S', key: 'p_act_s_max'}, 
            {label: 'میانگین توان اکتیو فاز S', key: 'p_act_s_ave'},
            {label: 'حداقل توان اکتیو فاز S', key: 'p_act_s_min'},
            {label: 'توان اکتیو فعلی فاز S', key: 'p_act_s_cur'},
            {label: 'حداکثر توان اکتیو فاز T', key: 'p_act_t_max'},
            {label: 'میانگین توان اکتیو فاز T', key: 'p_act_t_ave'},
            {label: 'حداقل توان اکتیو فاز T', key: 'p_act_t_min'},
            {label: 'توان اکتیو فعلی فاز T', key: 'p_act_t_cur'},
            {label: 'توان اکتیو ورودی به بار', key: 'p_act_into_load'},
            {label: 'توان اکتیو ورودی به شبکه', key: 'p_act_into_grid'},
        ]
    },
    {
        title: 'توان راکتیو',
        unit: 'kVAR',
        items: [
            {label: 'حداکثر توان راکتیو فاز R', key: 'p_ract_r_max'},
            {label: 'میانگین توان راکتیو فاز R', key: 'p_ract_r_ave'},
            {label: 'حداقل توان راکتیو فاز R', key: 'p_ract_r_min'},
            {label: 'توان راکتیو فعلی فاز R', key: 'p_ract_r_cur'},
            {label: 'حداکثر توان راکتیو فاز S', key: 'p_ract_s_max'},
            {label: 'میانگین توان راکتیو فاز S', key: 'p_ract_s_ave'},
            {label: 'حداقل توان راکتیو فاز S', key: 'p_ract_s_min'},
            {label: 'توان راکتیو فعلی فاز S', key: 'p_ract_s_cur'},
            {label: 'حداکثر توان راکتیو فاز T', key: 'p_ract_t_max'},
            {label: 'میانگین توان راکتیو فاز T', key: 'p_ract_t_ave'},
            {label: 'حداقل توان راکتیو فاز T', key: 'p_ract_t_min'},
            {label: 'توان راکتیو فعلی فاز T', key: 'p_ract_t_cur'},
            {label: 'توان راکتیو ورودی به بار', key: 'p_ract_into_load'},
            {label: 'توان راکتیو ورودی به شبکه', key: 'p_ract_into_grid'},
        ]
    },
    {
        title: 'توان ظاهری',
        unit: 'kVA',
        items: [
            {label: 'حداکثر توان ظاهری فاز R', key: 'p_apparent_r_max'},
            {label: 'میانگین توان ظاهری فاز R', key: 'p_apparent_r_ave'},
            {label: 'حداقل توان ظاهری فاز R', key: 'p_apparent_r_min'},
            {label: 'توان ظاهری فعلی فاز R', key: 'p_apparent_r_cur'},
            {label: 'حداکثر توان ظاهری فاز S', key: 'p_apparent_s_max'},
            {label: 'میانگین توان ظاهری فاز S', key: 'p_apparent_s_ave'},
            {label: 'حداقل توان ظاهری فاز S', key: 'p_apparent_s_min'},
            {label: 'توان ظاهری فعلی فاز S', key: 'p_apparent_s_cur'},
            {label: 'حداکثر توان ظاهری فاز T', key: 'p_apparent_t_max'},
            {label: 'میانگین توان ظاهری فاز T', key: 'p_apparent_t_ave'},
            {label: 'حداقل توان ظاهری فاز T', key: 'p_apparent_t_min'},
            {label: 'توان ظاهری فعلی فاز T', key: 'p_apparent_t_cur'},
            {label: 'توان ظاهری ورودی به بار', key: 'p_apparent_into_load'},
            {label: 'توان ظاهری ورودی به شبکه', key: 'p_apparent_into_grid'},
        ]
    },
    {
        title: 'ضریب توان',
        unit: '',
        items: [
            {label: 'حداکثر ضریب توان فاز R', key: 'cos_r_max'},
            {label: 'میانگین ضریب توان فاز R', key: 'cos_r_ave'},
            {label: 'حداقل ضریب توان فاز R', key: 'cos_r_min'},
            {label: 'ضریب توان فعلی فاز R', key: 'cos_r_cur'},
            {label: 'حداکثر ضریب توان فاز S', key: 'cos_s_max'},
            {label: 'میانگین ضریب توان فاز S', key: 'cos_s_ave'},
            {label: 'حداقل ضریب توان فاز S', key: 'cos_s_min'},
            {label: 'ضریب توان فعلی فاز S', key: 'cos_s_cur'},
            {label: 'حداکثر ضریب توان فاز T', key: 'cos_t_max'},
            {label: 'میانگین ضریب توان فاز T', key: 'cos_t_ave'},
            {label: 'حداقل ضریب توان فاز T', key: 'cos_t_min'},
            {label: 'ضریب توان فعلی فاز T', key: 'cos_t_cur'},
            {label: 'حداکثر ضریب توان کل', key: 'cos_total_max'},
            {label: 'میانگین ضریب توان کل', key: 'cos_total_ave'},
            {label: 'حداقل ضریب توان کل', key: 'cos_total_min'},
            {label: 'ضریب توان فعلی کل', key: 'cos_total_cur'},
        ]
    },
];

export const FRQ_CARDS = [
    {
        title: 'فرکانس',
        unit: 'HZ',
        items: [
            {label: 'حداکثر فرکانس', key: 'frq_max'},
            {label: 'میانگین فرکانس', key: 'frq_ave'},
            {label: 'حداقل فرکانس', key: 'frq_min'},
            {label: 'فرکانس فعلی', key: 'frq_cur'},
        ]
    },
    {
        title: 'اعوجاج هارمونیک کل (THD)',
        unit: '%',
        items: [
            {label: 'اعوجاج هارمونیک کل جریان فاز R', key: 'thd_ir'},
            {label: 'اعوجاج هارمونیک کل جریان فاز S', key: 'thd_is'},
            {label: 'اعوجاج هارمونیک کل جریان فاز T', key: 'thd_it'},
            {label: 'اعوجاج هارمونیک کل ولتاژ خط RS', key: 'thd_vrs'},
            {label: 'اعوجاج هارمونیک کل ولتاژ خط ST', key: 'thd_vst'},
            {label: 'اعوجاج هارمونیک کل ولتاژ خط RT', key: 'thd_vrt'},
            {label: 'اعوجاج هارمونیک کل ولتاژ فاز R-N', key: 'thd_vrn'},
            {label: 'اعوجاج هارمونیک کل ولتاژ فاز S-N', key: 'thd_vsn'},
            {label: 'اعوجاج هارمونیک کل ولتاژ فاز T-N', key: 'thd_vtn'},
        ]
    },
    {
        title: 'هارمونیک های جریان فاز R',
        unit: '%',
        items: [
            {label: 'هارمونیک اول فاز R', key: 'harmonic_1_R'},
            {label: 'هارمونیک دوم فاز R', key: 'harmonic_2_R'},
            {label: 'هارمونیک سوم فاز R', key: 'harmonic_3_R'},
            {label: 'هارمونیک چهارم فاز R', key: 'harmonic_4_R'},
            {label: 'هارمونیک پنجم فاز R', key: 'harmonic_5_R'},
            {label: 'هارمونیک ششم فاز R', key: 'harmonic_6_R'},
            {label: 'هارمونیک هفتم فاز R', key: 'harmonic_7_R'},
            {label: 'هارمونیک هشتم فاز R', key: 'harmonic_8_R'},
            {label: 'هارمونیک نهم فاز R', key: 'harmonic_9_R'},
            {label: 'هارمونیک دهم فاز R', key: 'harmonic_10_R'},
            {label: 'هارمونیک یازدهم فاز R', key: 'harmonic_11_R'},
            {label: 'هارمونیک دوازدهم فاز R', key: 'harmonic_12_R'},
            {label: 'هارمونیک سیزدهم فاز R', key: 'harmonic_13_R'},
            {label: 'هارمونیک چهاردهم فاز R', key: 'harmonic_14_R'},
            {label: 'هارمونیک پانزدهم فاز R', key: 'harmonic_15_R'},
        ]
    },
    {
        title: 'هارمونیک های جریان فاز S',
        unit: '%',
        items: [
            {label: 'هارمونیک اول فاز S', key: 'harmonic_1_S'},
            {label: 'هارمونیک دوم فاز S', key: 'harmonic_2_S'},
            {label: 'هارمونیک سوم فاز S', key: 'harmonic_3_S'},
            {label: 'هارمونیک چهارم فاز S', key: 'harmonic_4_S'},
            {label: 'هارمونیک پنجم فاز S', key: 'harmonic_5_S'},
            {label: 'هارمونیک ششم فاز S', key: 'harmonic_6_S'},
            {label: 'هارمونیک هفتم فاز S', key: 'harmonic_7_S'},
            {label: 'هارمونیک هشتم فاز S', key: 'harmonic_8_S'},
            {label: 'هارمونیک نهم فاز S', key: 'harmonic_9_S'},
            {label: 'هارمونیک دهم فاز S', key: 'harmonic_10_S'},
            {label: 'هارمونیک یازدهم فاز S', key: 'harmonic_11_S'},
            {label: 'هارمونیک دوازدهم فاز S', key: 'harmonic_12_S'},
            {label: 'هارمونیک سیزدهم فاز S', key: 'harmonic_13_S'},
            {label: 'هارمونیک چهاردهم فاز S', key: 'harmonic_14_S'},
            {label: 'هارمونیک پانزدهم فاز S', key: 'harmonic_15_S'},
        ]
    },
    {
        title: 'هارمونیک های جریان فاز T',
        unit: '%',
        items: [
            {label: 'هارمونیک اول فاز T', key: 'harmonic_1_T'},
            {label: 'هارمونیک دوم فاز T', key: 'harmonic_2_T'},
            {label: 'هارمونیک سوم فاز T', key: 'harmonic_3_T'},
            {label: 'هارمونیک چهارم فاز T', key: 'harmonic_4_T'},
            {label: 'هارمونیک پنجم فاز T', key: 'harmonic_5_T'},
            {label: 'هارمونیک ششم فاز T', key: 'harmonic_6_T'},
            {label: 'هارمونیک هفتم فاز T', key: 'harmonic_7_T'},
            {label: 'هارمونیک هشتم فاز T', key: 'harmonic_8_T'},
            {label: 'هارمونیک نهم فاز T', key: 'harmonic_9_T'},
            {label: 'هارمونیک دهم فاز T', key: 'harmonic_10_T'},
            {label: 'هارمونیک یازدهم فاز T', key: 'harmonic_11_T'},
            {label: 'هارمونیک دوازدهم فاز T', key: 'harmonic_12_T'},
            {label: 'هارمونیک سیزدهم فاز T', key: 'harmonic_13_T'},
            {label: 'هارمونیک چهاردهم فاز T', key: 'harmonic_14_T'},
            {label: 'هارمونیک پانزدهم فاز T', key: 'harmonic_15_T'},
        ]
    },
];

export const UserRole = {
    ADMIN: "Admin",
    INSTALLER: "Installer",
    REPORT: "Report",
    USER: "User",
} as const;