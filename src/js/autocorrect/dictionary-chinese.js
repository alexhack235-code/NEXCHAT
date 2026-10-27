/**
 * NEXCHAT Multilingual Sub-Directory: Chinese Pinyin & Web Slang (Deepened)
 * High-Speed O(1) Prefix-Indexed Radix Engine
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  const ZH_WORDS = [
  "nihao",
  "ninhao",
  "xiexie",
  "buxie",
  "duibuqi",
  "meiguanxi",
  "zaijian",
  "bukeqi",
  "mingtianjian",
  "yihuirjian",
  "zaoshanghao",
  "zaoan",
  "xiawuhao",
  "wanan",
  "wanshanghao",
  "qingwen",
  "laojia",
  "baoqian",
  "yuanliang",
  "zhufu",
  "gongxi",
  "facai",
  "kuaile",
  "shengrikuaile",
  "xinniankuaile",
  "wanshiruyi",
  "xintai",
  "pingan",
  "jiankang",
  "weishenme",
  "zenme",
  "zenmeyang",
  "shenme",
  "nar",
  "nali",
  "shei",
  "shui",
  "duoshao",
  "ji",
  "jidian",
  "duoda",
  "duochang",
  "duoyuan",
  "zenmeban",
  "haoma",
  "xingma",
  "keyima",
  "shibushi",
  "duibudui",
  "youmeiyou",
  "zhendema",
  "xianzai",
  "jintian",
  "mingtian",
  "zuotian",
  "houtian",
  "qiantian",
  "shijian",
  "zaoshang",
  "shangwu",
  "zhongwu",
  "xiawu",
  "wanshang",
  "banye",
  "lingchen",
  "yinian",
  "yiyue",
  "eryue",
  "sanyue",
  "siyue",
  "wuyue",
  "liuyue",
  "qiyue",
  "bayue",
  "jiuyue",
  "shiyue",
  "shiyiyue",
  "shieryue",
  "xingqi",
  "xingqiyi",
  "xingqier",
  "xingqisan",
  "xingqisi",
  "xingqiwu",
  "xingqiliu",
  "xingqiri",
  "zhoumo",
  "fenzhong",
  "xiaoshi",
  "miaozhong",
  "bange",
  "yike",
  "chafang",
  "chifan",
  "heshui",
  "shuijiao",
  "qichuang",
  "gongzuo",
  "xuexi",
  "kaishi",
  "jieshu",
  "huijia",
  "chumen",
  "daoda",
  "likai",
  "dengdai",
  "fasong",
  "jieshou",
  "dianhua",
  "shoudao",
  "kandao",
  "tingdao",
  "xiangdao",
  "mingbai",
  "dongle",
  "zhidao",
  "renshi",
  "xuehui",
  "wangji",
  "jide",
  "bangmang",
  "bangzhu",
  "gouwu",
  "maica",
  "maidan",
  "fukuan",
  "zhifu",
  "saoma",
  "chongzhi",
  "tixian",
  "yundong",
  "sanbu",
  "paobu",
  "youyong",
  "lvyou",
  "chufa",
  "huilai",
  "zuoxia",
  "zhanli",
  "kaiche",
  "zuoche",
  "daodi",
  "chuanjian",
  "tuoxia",
  "xishou",
  "xizao",
  "gaoxing",
  "kaixin",
  "xingfu",
  "nanguo",
  "shangxin",
  "tongku",
  "shengqi",
  "fanli",
  "haipa",
  "kongju",
  "jinzhang",
  "danxin",
  "fangxin",
  "anxin",
  "guangrong",
  "zihao",
  "jiaoao",
  "canlan",
  "yihan",
  "houhui",
  "lei",
  "kun",
  "e",
  "ke",
  "re",
  "leng",
  "nuanhuo",
  "liangkuai",
  "shufu",
  "tongkuai",
  "jiliao",
  "gudu",
  "wuliao",
  "xingfen",
  "ganji",
  "ganxie",
  "pengyou",
  "pengyoumen",
  "tongxue",
  "tongshi",
  "lingdao",
  "laoban",
  "kehu",
  "jiaren",
  "bama",
  "baba",
  "mama",
  "fuqin",
  "muqin",
  "erzi",
  "nver",
  "gege",
  "didi",
  "jiejie",
  "meimei",
  "yeye",
  "nainai",
  "waigong",
  "waipo",
  "shushu",
  "ayi",
  "laogong",
  "laopo",
  "zhangfu",
  "qizi",
  "nanyou",
  "nvyou",
  "duixiang",
  "lianren",
  "linju",
  "laoxiang",
  "shuren",
  "moshengren",
  "shouji",
  "diannao",
  "wangluo",
  "xinhao",
  "wifi",
  "ruanjian",
  "yingjian",
  "weixin",
  "weibo",
  "douyin",
  "kuaishou",
  "bilibili",
  "taobao",
  "jingdong",
  "youjian",
  "xinxi",
  "duanxin",
  "tongzhi",
  "pingmu",
  "jianpan",
  "shubiao",
  "chengshi",
  "guojia",
  "zhongguo",
  "beijing",
  "shanghai",
  "guangzhou",
  "shenzhen",
  "jia",
  "fangzi",
  "keting",
  "woshi",
  "chufang",
  "weishengjian",
  "yangtai",
  "xuexiao",
  "daxue",
  "yiyuan",
  "yaodian",
  "yinhang",
  "chaoshi",
  "shangdian",
  "mifan",
  "miantiao",
  "baozi",
  "jiaozi",
  "huntun",
  "chaofan",
  "kaoya",
  "huoguo",
  "shaokao",
  "malatang",
  "pingguo",
  "xiangjiao",
  "xigua",
  "cha",
  "kafei",
  "pijiu",
  "mashang",
  "yiqie",
  "ganmao",
  "yiyang",
  "keyi",
  "yinggai",
  "bucuo",
  "liaojie",
  "jieguo",
  "faxian",
  "jihua",
  "jieshao",
  "guiding",
  "wenti",
  "jiejue",
  "xuanze",
  "yaoqiu",
  "anpai",
  "qingkuang",
  "chengji",
  "fangfa",
  "huodong",
  "guanxi",
  "lianxi",
  "lianluo",
  "yingxiang",
  "zhuyi",
  "biaoxian",
  "jiaru",
  "xiangfa",
  "jihui",
  "jingyan",
  "yisi",
  "biaoshi",
  "shuoming",
  "zhengming",
  "kaolv",
  "qishi",
  "yiding",
  "bixu",
  "yongyuan",
  "jingchang",
  "tongchang",
  "yiban",
  "zongshi",
  "jihu",
  "yijing",
  "zhengzai",
  "xiangdang",
  "feichang",
  "juedui",
  "zhenzheng",
  "suoyi",
  "danshi",
  "buguo",
  "raner",
  "fouze",
  "yinci",
  "yinwei",
  "jishi",
  "ruguo",
  "suiran",
  "budan",
  "erqie",
  "huozhe",
  "haishi",
  "yyds",
  "xswl",
  "zqsg",
  "dddd",
  "plmm",
  "xgg",
  "xjj",
  "nsdd",
  "u1s1",
  "bdjw",
  "pyq",
  "bhys",
  "awsl",
  "ssfd",
  "dbq",
  "srds",
  "xdm",
  "cxk",
  "yygq",
  "blx",
  "520",
  "1314",
  "666",
  "886",
  "233",
  "555",
  "ling",
  "yi",
  "er",
  "san",
  "si",
  "wu",
  "liu",
  "qi",
  "ba",
  "jiu",
  "shi",
  "bai",
  "qian",
  "wan",
  "hongse",
  "lanse",
  "lvse",
  "huangse",
  "heise",
  "baise",
  "zise",
  "huise",
  "chengse",
  "fenhongse",
  "dong",
  "nan",
  "xi",
  "bei",
  "hou",
  "zuo",
  "you",
  "shang",
  "xia",
  "li",
  "wai",
  "zhong",
  "laoshi",
  "yisheng",
  "hushi",
  "jingcha",
  "lvshi",
  "gongchengshi",
  "siji",
  "fuwuyuan",
  "yanyuan"
];
  const ZH_TYPO_MAP = {
  "233": "ha ha ha",
  "520": "wo ai ni",
  "555": "wu wu wu",
  "666": "liu liu liu",
  "886": "bai bai le",
  "999": "liu fan le",
  "1314": "yi sheng yi shi",
  "9494": "jiu shi jiu shi",
  "nh": "nihao",
  "xx": "xiexie",
  "zj": "zaijian",
  "dbq": "duibuqi",
  "mgx": "meiguanxi",
  "hd": "haode",
  "zmy": "zenmeyang",
  "wsm": "weishenme",
  "sm": "shenme",
  "plz": "qing",
  "thx": "xiexie",
  "ty": "xiexie",
  "nb": "niubi",
  "tql": "tai qiang le",
  "awsl": "a wo si le",
  "yyds": "yong yuan de shen",
  "xswl": "xiao si wo le",
  "zqsg": "zhen qing shi gan",
  "dddd": "dong de dou dong",
  "plmm": "piao liang mei mei",
  "xgg": "xiao ge ge",
  "xjj": "xiao jie jie",
  "nsdd": "ni shuo de dui",
  "u1s1": "you yi shuo yi",
  "bdjw": "bu chi jian wen",
  "pyq": "peng you quan",
  "bhys": "bu hao yi si",
  "ssfd": "se se fa dou",
  "srds": "sui ran dan shi",
  "xdm": "xiong di men",
  "niha": "nihao",
  "niho": "nihao",
  "xexie": "xiexie",
  "xixi": "xiexie",
  "zaijan": "zaijian",
  "duibq": "duibuqi",
  "meigx": "meiguanxi",
  "weshenme": "weishenme",
  "shenm": "shenme",
  "shemne": "shenme",
  "zemneyang": "zenmeyang",
  "zenm": "zenme",
  "jintan": "jintian",
  "mingtan": "mingtian",
  "zuotan": "zuotian",
  "gongzu": "gongzuo",
  "xuex": "xuexi",
  "shijan": "shijian",
  "dianha": "dianhua",
  "wanglu": "wangluo",
  "shouj": "shouji",
  "dianna": "diannao",
  "haoch": "haochi",
  "haokn": "haokan",
  "xihua": "xihuan",
  "gaoxin": "gaoxing",
  "nangu": "nanguo",
  "shengq": "shengqi"
};
  const ZH_PREFIX_TABLE = {
  "13": [
    "1314"
  ],
  "23": [
    "233"
  ],
  "52": [
    "520"
  ],
  "55": [
    "555"
  ],
  "66": [
    "666"
  ],
  "88": [
    "886"
  ],
  "131": [
    "1314"
  ],
  "233": [
    "233"
  ],
  "520": [
    "520"
  ],
  "555": [
    "555"
  ],
  "666": [
    "666"
  ],
  "886": [
    "886"
  ],
  "1314": [
    "1314"
  ],
  "ni": [
    "nihao",
    "ninhao"
  ],
  "nih": [
    "nihao"
  ],
  "niha": [
    "nihao"
  ],
  "nin": [
    "ninhao"
  ],
  "ninh": [
    "ninhao"
  ],
  "xi": [
    "xiexie",
    "xiawuhao",
    "xinniankuaile",
    "xintai",
    "xingma",
    "xianzai",
    "xiawu",
    "xingqi",
    "xingqiyi",
    "xingqier",
    "xingqisan",
    "xingqisi",
    "xingqiwu",
    "xingqiliu",
    "xingqiri"
  ],
  "xie": [
    "xiexie"
  ],
  "xiex": [
    "xiexie"
  ],
  "bu": [
    "buxie",
    "bukeqi",
    "bucuo",
    "buguo",
    "budan"
  ],
  "bux": [
    "buxie"
  ],
  "buxi": [
    "buxie"
  ],
  "du": [
    "duibuqi",
    "duoshao",
    "duoda",
    "duochang",
    "duoyuan",
    "duibudui",
    "duixiang",
    "duanxin"
  ],
  "dui": [
    "duibuqi",
    "duibudui",
    "duixiang"
  ],
  "duib": [
    "duibuqi",
    "duibudui"
  ],
  "me": [
    "meiguanxi",
    "meimei"
  ],
  "mei": [
    "meiguanxi",
    "meimei"
  ],
  "meig": [
    "meiguanxi"
  ],
  "za": [
    "zaijian",
    "zaoshanghao",
    "zaoan",
    "zaoshang"
  ],
  "zai": [
    "zaijian"
  ],
  "zaij": [
    "zaijian"
  ],
  "buk": [
    "bukeqi"
  ],
  "buke": [
    "bukeqi"
  ],
  "mi": [
    "mingtianjian",
    "mingtian",
    "miaozhong",
    "mingbai",
    "mifan",
    "miantiao"
  ],
  "min": [
    "mingtianjian",
    "mingtian",
    "mingbai"
  ],
  "ming": [
    "mingtianjian",
    "mingtian",
    "mingbai"
  ],
  "yi": [
    "yihuirjian",
    "yinian",
    "yiyue",
    "yike",
    "yihan",
    "yingjian",
    "yiyuan",
    "yinhang",
    "yiqie",
    "yiyang",
    "yinggai",
    "yingxiang",
    "yisi",
    "yiding",
    "yiban"
  ],
  "yih": [
    "yihuirjian",
    "yihan"
  ],
  "yihu": [
    "yihuirjian"
  ],
  "zao": [
    "zaoshanghao",
    "zaoan",
    "zaoshang"
  ],
  "zaos": [
    "zaoshanghao",
    "zaoshang"
  ],
  "zaoa": [
    "zaoan"
  ],
  "xia": [
    "xiawuhao",
    "xianzai",
    "xiawu",
    "xiaoshi",
    "xiangdao",
    "xiangjiao",
    "xiangfa",
    "xiangdang",
    "xia"
  ],
  "xiaw": [
    "xiawuhao",
    "xiawu"
  ],
  "wa": [
    "wanan",
    "wanshanghao",
    "wanshiruyi",
    "wanshang",
    "wangji",
    "waigong",
    "waipo",
    "wangluo",
    "wan",
    "wai"
  ],
  "wan": [
    "wanan",
    "wanshanghao",
    "wanshiruyi",
    "wanshang",
    "wangji",
    "wangluo",
    "wan"
  ],
  "wana": [
    "wanan"
  ],
  "wans": [
    "wanshanghao",
    "wanshiruyi",
    "wanshang"
  ],
  "qi": [
    "qingwen",
    "qiantian",
    "qiyue",
    "qichuang",
    "qizi",
    "qingkuang",
    "qishi",
    "qi",
    "qian"
  ],
  "qin": [
    "qingwen",
    "qingkuang"
  ],
  "qing": [
    "qingwen",
    "qingkuang"
  ],
  "la": [
    "laojia",
    "laoban",
    "laogong",
    "laopo",
    "laoxiang",
    "lanse",
    "laoshi"
  ],
  "lao": [
    "laojia",
    "laoban",
    "laogong",
    "laopo",
    "laoxiang",
    "laoshi"
  ],
  "laoj": [
    "laojia"
  ],
  "ba": [
    "baoqian",
    "banye",
    "bayue",
    "bange",
    "bangmang",
    "bangzhu",
    "bama",
    "baba",
    "baozi",
    "ba",
    "bai",
    "baise"
  ],
  "bao": [
    "baoqian",
    "baozi"
  ],
  "baoq": [
    "baoqian"
  ],
  "yu": [
    "yuanliang",
    "yundong"
  ],
  "yua": [
    "yuanliang"
  ],
  "yuan": [
    "yuanliang"
  ],
  "zh": [
    "zhufu",
    "zhendema",
    "zhongwu",
    "zhoumo",
    "zhidao",
    "zhifu",
    "zhanli",
    "zhangfu",
    "zhongguo",
    "zhuyi",
    "zhengming",
    "zhengzai",
    "zhenzheng",
    "zhong"
  ],
  "zhu": [
    "zhufu",
    "zhuyi"
  ],
  "zhuf": [
    "zhufu"
  ],
  "go": [
    "gongxi",
    "gongzuo",
    "gouwu",
    "gongchengshi"
  ],
  "gon": [
    "gongxi",
    "gongzuo",
    "gongchengshi"
  ],
  "gong": [
    "gongxi",
    "gongzuo",
    "gongchengshi"
  ],
  "fa": [
    "facai",
    "fasong",
    "fanli",
    "fangxin",
    "fangzi",
    "faxian",
    "fangfa"
  ],
  "fac": [
    "facai"
  ],
  "faca": [
    "facai"
  ],
  "ku": [
    "kuaile",
    "kun",
    "kuaishou"
  ],
  "kua": [
    "kuaile",
    "kuaishou"
  ],
  "kuai": [
    "kuaile",
    "kuaishou"
  ],
  "sh": [
    "shengrikuaile",
    "shenme",
    "shei",
    "shui",
    "shibushi",
    "shijian",
    "shangwu",
    "shiyue",
    "shiyiyue",
    "shieryue",
    "shuijiao",
    "shoudao",
    "shangxin",
    "shengqi",
    "shufu"
  ],
  "she": [
    "shengrikuaile",
    "shenme",
    "shei",
    "shengqi",
    "shenzhen"
  ],
  "shen": [
    "shengrikuaile",
    "shenme",
    "shengqi",
    "shenzhen"
  ],
  "xin": [
    "xinniankuaile",
    "xintai",
    "xingma",
    "xingqi",
    "xingqiyi",
    "xingqier",
    "xingqisan",
    "xingqisi",
    "xingqiwu",
    "xingqiliu",
    "xingqiri",
    "xingfu",
    "xingfen",
    "xinhao",
    "xinxi"
  ],
  "xinn": [
    "xinniankuaile"
  ],
  "xint": [
    "xintai"
  ],
  "pi": [
    "pingan",
    "pingmu",
    "pingguo",
    "pijiu"
  ],
  "pin": [
    "pingan",
    "pingmu",
    "pingguo"
  ],
  "ping": [
    "pingan",
    "pingmu",
    "pingguo"
  ],
  "ji": [
    "jiankang",
    "ji",
    "jidian",
    "jintian",
    "jiuyue",
    "jieshu",
    "jieshou",
    "jide",
    "jinzhang",
    "jiaoao",
    "jiliao",
    "jiaren",
    "jiejie",
    "jingdong",
    "jianpan"
  ],
  "jia": [
    "jiankang",
    "jiaoao",
    "jiaren",
    "jianpan",
    "jia",
    "jiaozi",
    "jiaru"
  ],
  "jian": [
    "jiankang",
    "jianpan"
  ],
  "we": [
    "weishenme",
    "weixin",
    "weibo",
    "weishengjian",
    "wenti"
  ],
  "wei": [
    "weishenme",
    "weixin",
    "weibo",
    "weishengjian"
  ],
  "weis": [
    "weishenme",
    "weishengjian"
  ],
  "ze": [
    "zenme",
    "zenmeyang",
    "zenmeban"
  ],
  "zen": [
    "zenme",
    "zenmeyang",
    "zenmeban"
  ],
  "zenm": [
    "zenme",
    "zenmeyang",
    "zenmeban"
  ],
  "na": [
    "nar",
    "nali",
    "nanguo",
    "nainai",
    "nanyou",
    "nan"
  ],
  "nar": [
    "nar"
  ],
  "nal": [
    "nali"
  ],
  "nali": [
    "nali"
  ],
  "shei": [
    "shei"
  ],
  "shu": [
    "shui",
    "shuijiao",
    "shufu",
    "shushu",
    "shuren",
    "shubiao",
    "shuoming"
  ],
  "shui": [
    "shui",
    "shuijiao"
  ],
  "duo": [
    "duoshao",
    "duoda",
    "duochang",
    "duoyuan"
  ],
  "duos": [
    "duoshao"
  ],
  "jid": [
    "jidian",
    "jide"
  ],
  "jidi": [
    "jidian"
  ],
  "duod": [
    "duoda"
  ],
  "duoc": [
    "duochang"
  ],
  "duoy": [
    "duoyuan"
  ],
  "ha": [
    "haoma",
    "haipa",
    "haishi"
  ],
  "hao": [
    "haoma"
  ],
  "haom": [
    "haoma"
  ],
  "xing": [
    "xingma",
    "xingqi",
    "xingqiyi",
    "xingqier",
    "xingqisan",
    "xingqisi",
    "xingqiwu",
    "xingqiliu",
    "xingqiri",
    "xingfu",
    "xingfen"
  ],
  "ke": [
    "keyima",
    "ke",
    "kehu",
    "keting",
    "keyi"
  ],
  "key": [
    "keyima",
    "keyi"
  ],
  "keyi": [
    "keyima",
    "keyi"
  ],
  "shi": [
    "shibushi",
    "shijian",
    "shiyue",
    "shiyiyue",
    "shieryue",
    "shi"
  ],
  "shib": [
    "shibushi"
  ],
  "yo": [
    "youmeiyou",
    "youyong",
    "youjian",
    "yongyuan",
    "you"
  ],
  "you": [
    "youmeiyou",
    "youyong",
    "youjian",
    "you"
  ],
  "youm": [
    "youmeiyou"
  ],
  "zhe": [
    "zhendema",
    "zhengming",
    "zhengzai",
    "zhenzheng"
  ],
  "zhen": [
    "zhendema",
    "zhengming",
    "zhengzai",
    "zhenzheng"
  ],
  "xian": [
    "xianzai",
    "xiangdao",
    "xiangjiao",
    "xiangfa",
    "xiangdang"
  ],
  "jin": [
    "jintian",
    "jinzhang",
    "jingdong",
    "jingyan",
    "jingchang",
    "jingcha"
  ],
  "jint": [
    "jintian"
  ],
  "zu": [
    "zuotian",
    "zuoxia",
    "zuoche",
    "zuo"
  ],
  "zuo": [
    "zuotian",
    "zuoxia",
    "zuoche",
    "zuo"
  ],
  "zuot": [
    "zuotian"
  ],
  "ho": [
    "houtian",
    "houhui",
    "hongse",
    "hou"
  ],
  "hou": [
    "houtian",
    "houhui",
    "hou"
  ],
  "hout": [
    "houtian"
  ],
  "qia": [
    "qiantian",
    "qian"
  ],
  "qian": [
    "qiantian",
    "qian"
  ],
  "shij": [
    "shijian"
  ],
  "sha": [
    "shangwu",
    "shangxin",
    "shanghai",
    "shangdian",
    "shaokao",
    "shang"
  ],
  "shan": [
    "shangwu",
    "shangxin",
    "shanghai",
    "shangdian",
    "shang"
  ],
  "zho": [
    "zhongwu",
    "zhoumo",
    "zhongguo",
    "zhong"
  ],
  "zhon": [
    "zhongwu",
    "zhongguo",
    "zhong"
  ],
  "ban": [
    "banye",
    "bange",
    "bangmang",
    "bangzhu"
  ],
  "bany": [
    "banye"
  ],
  "li": [
    "lingchen",
    "liuyue",
    "likai",
    "liangkuai",
    "lingdao",
    "lianren",
    "linju",
    "liaojie",
    "lianxi",
    "lianluo",
    "ling",
    "liu",
    "li"
  ],
  "lin": [
    "lingchen",
    "lingdao",
    "linju",
    "ling"
  ],
  "ling": [
    "lingchen",
    "lingdao",
    "ling"
  ],
  "yin": [
    "yinian",
    "yingjian",
    "yinhang",
    "yinggai",
    "yingxiang",
    "yinci",
    "yinwei"
  ],
  "yini": [
    "yinian"
  ],
  "yiy": [
    "yiyue",
    "yiyuan",
    "yiyang"
  ],
  "yiyu": [
    "yiyue",
    "yiyuan"
  ],
  "er": [
    "eryue",
    "erzi",
    "erqie",
    "er"
  ],
  "ery": [
    "eryue"
  ],
  "eryu": [
    "eryue"
  ],
  "sa": [
    "sanyue",
    "saoma",
    "sanbu",
    "san"
  ],
  "san": [
    "sanyue",
    "sanbu",
    "san"
  ],
  "sany": [
    "sanyue"
  ],
  "si": [
    "siyue",
    "si",
    "siji"
  ],
  "siy": [
    "siyue"
  ],
  "siyu": [
    "siyue"
  ],
  "wu": [
    "wuyue",
    "wuliao",
    "wu"
  ],
  "wuy": [
    "wuyue"
  ],
  "wuyu": [
    "wuyue"
  ],
  "liu": [
    "liuyue",
    "liu"
  ],
  "liuy": [
    "liuyue"
  ],
  "qiy": [
    "qiyue"
  ],
  "qiyu": [
    "qiyue"
  ],
  "bay": [
    "bayue"
  ],
  "bayu": [
    "bayue"
  ],
  "jiu": [
    "jiuyue",
    "jiu"
  ],
  "jiuy": [
    "jiuyue"
  ],
  "shiy": [
    "shiyue",
    "shiyiyue"
  ],
  "shie": [
    "shieryue"
  ],
  "zhou": [
    "zhoumo"
  ],
  "fe": [
    "fenzhong",
    "feichang",
    "fenhongse"
  ],
  "fen": [
    "fenzhong",
    "fenhongse"
  ],
  "fenz": [
    "fenzhong"
  ],
  "xiao": [
    "xiaoshi"
  ],
  "mia": [
    "miaozhong",
    "miantiao"
  ],
  "miao": [
    "miaozhong"
  ],
  "bang": [
    "bange",
    "bangmang",
    "bangzhu"
  ],
  "yik": [
    "yike"
  ],
  "yike": [
    "yike"
  ],
  "ch": [
    "chafang",
    "chifan",
    "chumen",
    "chongzhi",
    "chufa",
    "chuanjian",
    "chengshi",
    "chufang",
    "chaoshi",
    "chaofan",
    "cha",
    "chengji",
    "chengse"
  ],
  "cha": [
    "chafang",
    "chaoshi",
    "chaofan",
    "cha"
  ],
  "chaf": [
    "chafang"
  ],
  "chi": [
    "chifan"
  ],
  "chif": [
    "chifan"
  ],
  "he": [
    "heshui",
    "heise"
  ],
  "hes": [
    "heshui"
  ],
  "hesh": [
    "heshui"
  ],
  "qic": [
    "qichuang"
  ],
  "qich": [
    "qichuang"
  ],
  "xu": [
    "xuexi",
    "xuehui",
    "xuexiao",
    "xuanze"
  ],
  "xue": [
    "xuexi",
    "xuehui",
    "xuexiao"
  ],
  "xuex": [
    "xuexi",
    "xuexiao"
  ],
  "ka": [
    "kaishi",
    "kandao",
    "kaiche",
    "kaixin",
    "kaoya",
    "kafei",
    "kaolv"
  ],
  "kai": [
    "kaishi",
    "kaiche",
    "kaixin"
  ],
  "kais": [
    "kaishi"
  ],
  "jie": [
    "jieshu",
    "jieshou",
    "jiejie",
    "jieguo",
    "jieshao",
    "jiejue"
  ],
  "jies": [
    "jieshu",
    "jieshou",
    "jieshao"
  ],
  "hu": [
    "huijia",
    "huilai",
    "huntun",
    "huoguo",
    "huodong",
    "huozhe",
    "huangse",
    "huise",
    "hushi"
  ],
  "hui": [
    "huijia",
    "huilai",
    "huise"
  ],
  "huij": [
    "huijia"
  ],
  "chu": [
    "chumen",
    "chufa",
    "chuanjian",
    "chufang"
  ],
  "chum": [
    "chumen"
  ],
  "da": [
    "daoda",
    "daodi",
    "danxin",
    "daxue",
    "danshi"
  ],
  "dao": [
    "daoda",
    "daodi"
  ],
  "daod": [
    "daoda",
    "daodi"
  ],
  "lik": [
    "likai"
  ],
  "lika": [
    "likai"
  ],
  "de": [
    "dengdai"
  ],
  "den": [
    "dengdai"
  ],
  "deng": [
    "dengdai"
  ],
  "fas": [
    "fasong"
  ],
  "faso": [
    "fasong"
  ],
  "di": [
    "dianhua",
    "didi",
    "diannao"
  ],
  "dia": [
    "dianhua",
    "diannao"
  ],
  "dian": [
    "dianhua",
    "diannao"
  ],
  "sho": [
    "shoudao",
    "shouji"
  ],
  "shou": [
    "shoudao",
    "shouji"
  ],
  "kan": [
    "kandao"
  ],
  "kand": [
    "kandao"
  ],
  "ti": [
    "tingdao",
    "tixian"
  ],
  "tin": [
    "tingdao"
  ],
  "ting": [
    "tingdao"
  ],
  "do": [
    "dongle",
    "douyin",
    "dong"
  ],
  "don": [
    "dongle",
    "dong"
  ],
  "dong": [
    "dongle",
    "dong"
  ],
  "zhi": [
    "zhidao",
    "zhifu"
  ],
  "zhid": [
    "zhidao"
  ],
  "re": [
    "renshi",
    "re"
  ],
  "ren": [
    "renshi"
  ],
  "rens": [
    "renshi"
  ],
  "xueh": [
    "xuehui"
  ],
  "wang": [
    "wangji",
    "wangluo"
  ],
  "jide": [
    "jide"
  ],
  "gou": [
    "gouwu"
  ],
  "gouw": [
    "gouwu"
  ],
  "ma": [
    "maica",
    "maidan",
    "mama",
    "malatang",
    "mashang"
  ],
  "mai": [
    "maica",
    "maidan"
  ],
  "maic": [
    "maica"
  ],
  "maid": [
    "maidan"
  ],
  "fu": [
    "fukuan",
    "fuqin",
    "fuwuyuan"
  ],
  "fuk": [
    "fukuan"
  ],
  "fuku": [
    "fukuan"
  ],
  "zhif": [
    "zhifu"
  ],
  "sao": [
    "saoma"
  ],
  "saom": [
    "saoma"
  ],
  "cho": [
    "chongzhi"
  ],
  "chon": [
    "chongzhi"
  ],
  "tix": [
    "tixian"
  ],
  "tixi": [
    "tixian"
  ],
  "yun": [
    "yundong"
  ],
  "yund": [
    "yundong"
  ],
  "sanb": [
    "sanbu"
  ],
  "pa": [
    "paobu"
  ],
  "pao": [
    "paobu"
  ],
  "paob": [
    "paobu"
  ],
  "youy": [
    "youyong"
  ],
  "lv": [
    "lvyou",
    "lvse",
    "lvshi"
  ],
  "lvy": [
    "lvyou"
  ],
  "lvyo": [
    "lvyou"
  ],
  "chuf": [
    "chufa",
    "chufang"
  ],
  "huil": [
    "huilai"
  ],
  "zuox": [
    "zuoxia"
  ],
  "zha": [
    "zhanli",
    "zhangfu"
  ],
  "zhan": [
    "zhanli",
    "zhangfu"
  ],
  "kaic": [
    "kaiche"
  ],
  "zuoc": [
    "zuoche"
  ],
  "chua": [
    "chuanjian"
  ],
  "tu": [
    "tuoxia"
  ],
  "tuo": [
    "tuoxia"
  ],
  "tuox": [
    "tuoxia"
  ],
  "xis": [
    "xishou"
  ],
  "xish": [
    "xishou"
  ],
  "xiz": [
    "xizao"
  ],
  "xiza": [
    "xizao"
  ],
  "ga": [
    "gaoxing",
    "ganji",
    "ganxie",
    "ganmao"
  ],
  "gao": [
    "gaoxing"
  ],
  "gaox": [
    "gaoxing"
  ],
  "kaix": [
    "kaixin"
  ],
  "nan": [
    "nanguo",
    "nanyou",
    "nan"
  ],
  "nang": [
    "nanguo"
  ],
  "to": [
    "tongku",
    "tongkuai",
    "tongxue",
    "tongshi",
    "tongzhi",
    "tongchang"
  ],
  "ton": [
    "tongku",
    "tongkuai",
    "tongxue",
    "tongshi",
    "tongzhi",
    "tongchang"
  ],
  "tong": [
    "tongku",
    "tongkuai",
    "tongxue",
    "tongshi",
    "tongzhi",
    "tongchang"
  ],
  "fan": [
    "fanli",
    "fangxin",
    "fangzi",
    "fangfa"
  ],
  "fanl": [
    "fanli"
  ],
  "hai": [
    "haipa",
    "haishi"
  ],
  "haip": [
    "haipa"
  ],
  "ko": [
    "kongju"
  ],
  "kon": [
    "kongju"
  ],
  "kong": [
    "kongju"
  ],
  "jinz": [
    "jinzhang"
  ],
  "dan": [
    "danxin",
    "danshi"
  ],
  "danx": [
    "danxin"
  ],
  "fang": [
    "fangxin",
    "fangzi",
    "fangfa"
  ],
  "an": [
    "anxin",
    "anpai"
  ],
  "anx": [
    "anxin"
  ],
  "anxi": [
    "anxin"
  ],
  "gu": [
    "guangrong",
    "gudu",
    "guojia",
    "guangzhou",
    "guiding",
    "guanxi"
  ],
  "gua": [
    "guangrong",
    "guangzhou",
    "guanxi"
  ],
  "guan": [
    "guangrong",
    "guangzhou",
    "guanxi"
  ],
  "zi": [
    "zihao",
    "zise"
  ],
  "zih": [
    "zihao"
  ],
  "ziha": [
    "zihao"
  ],
  "jiao": [
    "jiaoao",
    "jiaozi"
  ],
  "ca": [
    "canlan"
  ],
  "can": [
    "canlan"
  ],
  "canl": [
    "canlan"
  ],
  "yiha": [
    "yihan"
  ],
  "houh": [
    "houhui"
  ],
  "le": [
    "lei",
    "leng"
  ],
  "lei": [
    "lei"
  ],
  "kun": [
    "kun"
  ],
  "len": [
    "leng"
  ],
  "leng": [
    "leng"
  ],
  "nu": [
    "nuanhuo"
  ],
  "nua": [
    "nuanhuo"
  ],
  "nuan": [
    "nuanhuo"
  ],
  "lia": [
    "liangkuai",
    "lianren",
    "liaojie",
    "lianxi",
    "lianluo"
  ],
  "lian": [
    "liangkuai",
    "lianren",
    "lianxi",
    "lianluo"
  ],
  "shuf": [
    "shufu"
  ],
  "jil": [
    "jiliao"
  ],
  "jili": [
    "jiliao"
  ],
  "gud": [
    "gudu"
  ],
  "gudu": [
    "gudu"
  ],
  "wul": [
    "wuliao"
  ],
  "wuli": [
    "wuliao"
  ],
  "gan": [
    "ganji",
    "ganxie",
    "ganmao"
  ],
  "ganj": [
    "ganji"
  ],
  "ganx": [
    "ganxie"
  ],
  "pe": [
    "pengyou",
    "pengyoumen"
  ],
  "pen": [
    "pengyou",
    "pengyoumen"
  ],
  "peng": [
    "pengyou",
    "pengyoumen"
  ],
  "laob": [
    "laoban"
  ],
  "keh": [
    "kehu"
  ],
  "kehu": [
    "kehu"
  ],
  "jiar": [
    "jiaren",
    "jiaru"
  ],
  "bam": [
    "bama"
  ],
  "bama": [
    "bama"
  ],
  "bab": [
    "baba"
  ],
  "baba": [
    "baba"
  ],
  "mam": [
    "mama"
  ],
  "mama": [
    "mama"
  ],
  "fuq": [
    "fuqin"
  ],
  "fuqi": [
    "fuqin"
  ],
  "mu": [
    "muqin"
  ],
  "muq": [
    "muqin"
  ],
  "muqi": [
    "muqin"
  ],
  "erz": [
    "erzi"
  ],
  "erzi": [
    "erzi"
  ],
  "nv": [
    "nver",
    "nvyou"
  ],
  "nve": [
    "nver"
  ],
  "nver": [
    "nver"
  ],
  "ge": [
    "gege"
  ],
  "geg": [
    "gege"
  ],
  "gege": [
    "gege"
  ],
  "did": [
    "didi"
  ],
  "didi": [
    "didi"
  ],
  "jiej": [
    "jiejie",
    "jiejue"
  ],
  "meim": [
    "meimei"
  ],
  "ye": [
    "yeye"
  ],
  "yey": [
    "yeye"
  ],
  "yeye": [
    "yeye"
  ],
  "nai": [
    "nainai"
  ],
  "nain": [
    "nainai"
  ],
  "wai": [
    "waigong",
    "waipo",
    "wai"
  ],
  "waig": [
    "waigong"
  ],
  "waip": [
    "waipo"
  ],
  "shus": [
    "shushu"
  ],
  "ay": [
    "ayi"
  ],
  "ayi": [
    "ayi"
  ],
  "laog": [
    "laogong"
  ],
  "laop": [
    "laopo"
  ],
  "qiz": [
    "qizi"
  ],
  "qizi": [
    "qizi"
  ],
  "nany": [
    "nanyou"
  ],
  "nvy": [
    "nvyou"
  ],
  "nvyo": [
    "nvyou"
  ],
  "duix": [
    "duixiang"
  ],
  "linj": [
    "linju"
  ],
  "laox": [
    "laoxiang"
  ],
  "shur": [
    "shuren"
  ],
  "mo": [
    "moshengren"
  ],
  "mos": [
    "moshengren"
  ],
  "mosh": [
    "moshengren"
  ],
  "xinh": [
    "xinhao"
  ],
  "wi": [
    "wifi"
  ],
  "wif": [
    "wifi"
  ],
  "wifi": [
    "wifi"
  ],
  "ru": [
    "ruanjian",
    "ruguo"
  ],
  "rua": [
    "ruanjian"
  ],
  "ruan": [
    "ruanjian"
  ],
  "ying": [
    "yingjian",
    "yinggai",
    "yingxiang"
  ],
  "weix": [
    "weixin"
  ],
  "weib": [
    "weibo"
  ],
  "dou": [
    "douyin"
  ],
  "douy": [
    "douyin"
  ],
  "bi": [
    "bilibili",
    "biaoxian",
    "biaoshi",
    "bixu"
  ],
  "bil": [
    "bilibili"
  ],
  "bili": [
    "bilibili"
  ],
  "ta": [
    "taobao"
  ],
  "tao": [
    "taobao"
  ],
  "taob": [
    "taobao"
  ],
  "jing": [
    "jingdong",
    "jingyan",
    "jingchang",
    "jingcha"
  ],
  "youj": [
    "youjian"
  ],
  "xinx": [
    "xinxi"
  ],
  "dua": [
    "duanxin"
  ],
  "duan": [
    "duanxin"
  ],
  "shub": [
    "shubiao"
  ],
  "che": [
    "chengshi",
    "chengji",
    "chengse"
  ],
  "chen": [
    "chengshi",
    "chengji",
    "chengse"
  ],
  "guo": [
    "guojia"
  ],
  "guoj": [
    "guojia"
  ],
  "be": [
    "beijing",
    "bei"
  ],
  "bei": [
    "beijing",
    "bei"
  ],
  "beij": [
    "beijing"
  ],
  "ket": [
    "keting"
  ],
  "keti": [
    "keting"
  ],
  "wo": [
    "woshi"
  ],
  "wos": [
    "woshi"
  ],
  "wosh": [
    "woshi"
  ],
  "ya": [
    "yangtai",
    "yaodian",
    "yaoqiu",
    "yanyuan"
  ],
  "yan": [
    "yangtai",
    "yanyuan"
  ],
  "yang": [
    "yangtai"
  ],
  "dax": [
    "daxue"
  ],
  "daxu": [
    "daxue"
  ],
  "yao": [
    "yaodian",
    "yaoqiu"
  ],
  "yaod": [
    "yaodian"
  ],
  "yinh": [
    "yinhang"
  ],
  "chao": [
    "chaoshi",
    "chaofan"
  ],
  "mif": [
    "mifan"
  ],
  "mifa": [
    "mifan"
  ],
  "mian": [
    "miantiao"
  ],
  "baoz": [
    "baozi"
  ],
  "hun": [
    "huntun"
  ],
  "hunt": [
    "huntun"
  ],
  "kao": [
    "kaoya",
    "kaolv"
  ],
  "kaoy": [
    "kaoya"
  ],
  "huo": [
    "huoguo",
    "huodong",
    "huozhe"
  ],
  "huog": [
    "huoguo"
  ],
  "shao": [
    "shaokao"
  ],
  "mal": [
    "malatang"
  ],
  "mala": [
    "malatang"
  ],
  "xig": [
    "xigua"
  ],
  "xigu": [
    "xigua"
  ],
  "kaf": [
    "kafei"
  ],
  "kafe": [
    "kafei"
  ],
  "pij": [
    "pijiu"
  ],
  "piji": [
    "pijiu"
  ],
  "mas": [
    "mashang"
  ],
  "mash": [
    "mashang"
  ],
  "yiq": [
    "yiqie"
  ],
  "yiqi": [
    "yiqie"
  ],
  "ganm": [
    "ganmao"
  ],
  "yiya": [
    "yiyang"
  ],
  "buc": [
    "bucuo"
  ],
  "bucu": [
    "bucuo"
  ],
  "liao": [
    "liaojie"
  ],
  "jieg": [
    "jieguo"
  ],
  "fax": [
    "faxian"
  ],
  "faxi": [
    "faxian"
  ],
  "jih": [
    "jihua",
    "jihui",
    "jihu"
  ],
  "jihu": [
    "jihua",
    "jihui",
    "jihu"
  ],
  "gui": [
    "guiding"
  ],
  "guid": [
    "guiding"
  ],
  "wen": [
    "wenti"
  ],
  "went": [
    "wenti"
  ],
  "xua": [
    "xuanze"
  ],
  "xuan": [
    "xuanze"
  ],
  "yaoq": [
    "yaoqiu"
  ],
  "anp": [
    "anpai"
  ],
  "anpa": [
    "anpai"
  ],
  "huod": [
    "huodong"
  ],
  "zhuy": [
    "zhuyi"
  ],
  "bia": [
    "biaoxian",
    "biaoshi"
  ],
  "biao": [
    "biaoxian",
    "biaoshi"
  ],
  "yis": [
    "yisi",
    "yisheng"
  ],
  "yisi": [
    "yisi"
  ],
  "shuo": [
    "shuoming"
  ],
  "kaol": [
    "kaolv"
  ],
  "qis": [
    "qishi"
  ],
  "qish": [
    "qishi"
  ],
  "yid": [
    "yiding"
  ],
  "yidi": [
    "yiding"
  ],
  "bix": [
    "bixu"
  ],
  "bixu": [
    "bixu"
  ],
  "yon": [
    "yongyuan"
  ],
  "yong": [
    "yongyuan"
  ],
  "yib": [
    "yiban"
  ],
  "yiba": [
    "yiban"
  ],
  "zo": [
    "zongshi"
  ],
  "zon": [
    "zongshi"
  ],
  "zong": [
    "zongshi"
  ],
  "yij": [
    "yijing"
  ],
  "yiji": [
    "yijing"
  ],
  "fei": [
    "feichang"
  ],
  "feic": [
    "feichang"
  ],
  "ju": [
    "juedui"
  ],
  "jue": [
    "juedui"
  ],
  "jued": [
    "juedui"
  ],
  "su": [
    "suoyi",
    "suiran"
  ],
  "suo": [
    "suoyi"
  ],
  "suoy": [
    "suoyi"
  ],
  "dans": [
    "danshi"
  ],
  "bug": [
    "buguo"
  ],
  "bugu": [
    "buguo"
  ],
  "ra": [
    "raner"
  ],
  "ran": [
    "raner"
  ],
  "rane": [
    "raner"
  ],
  "fo": [
    "fouze"
  ],
  "fou": [
    "fouze"
  ],
  "fouz": [
    "fouze"
  ],
  "yinc": [
    "yinci"
  ],
  "yinw": [
    "yinwei"
  ],
  "jis": [
    "jishi"
  ],
  "jish": [
    "jishi"
  ],
  "rug": [
    "ruguo"
  ],
  "rugu": [
    "ruguo"
  ],
  "sui": [
    "suiran"
  ],
  "suir": [
    "suiran"
  ],
  "bud": [
    "budan"
  ],
  "buda": [
    "budan"
  ],
  "erq": [
    "erqie"
  ],
  "erqi": [
    "erqie"
  ],
  "huoz": [
    "huozhe"
  ],
  "hais": [
    "haishi"
  ],
  "yy": [
    "yyds",
    "yygq"
  ],
  "yyd": [
    "yyds"
  ],
  "yyds": [
    "yyds"
  ],
  "xs": [
    "xswl"
  ],
  "xsw": [
    "xswl"
  ],
  "xswl": [
    "xswl"
  ],
  "zq": [
    "zqsg"
  ],
  "zqs": [
    "zqsg"
  ],
  "zqsg": [
    "zqsg"
  ],
  "dd": [
    "dddd"
  ],
  "ddd": [
    "dddd"
  ],
  "dddd": [
    "dddd"
  ],
  "pl": [
    "plmm"
  ],
  "plm": [
    "plmm"
  ],
  "plmm": [
    "plmm"
  ],
  "xg": [
    "xgg"
  ],
  "xgg": [
    "xgg"
  ],
  "xj": [
    "xjj"
  ],
  "xjj": [
    "xjj"
  ],
  "ns": [
    "nsdd"
  ],
  "nsd": [
    "nsdd"
  ],
  "nsdd": [
    "nsdd"
  ],
  "u1": [
    "u1s1"
  ],
  "u1s": [
    "u1s1"
  ],
  "u1s1": [
    "u1s1"
  ],
  "bd": [
    "bdjw"
  ],
  "bdj": [
    "bdjw"
  ],
  "bdjw": [
    "bdjw"
  ],
  "py": [
    "pyq"
  ],
  "pyq": [
    "pyq"
  ],
  "bh": [
    "bhys"
  ],
  "bhy": [
    "bhys"
  ],
  "bhys": [
    "bhys"
  ],
  "aw": [
    "awsl"
  ],
  "aws": [
    "awsl"
  ],
  "awsl": [
    "awsl"
  ],
  "ss": [
    "ssfd"
  ],
  "ssf": [
    "ssfd"
  ],
  "ssfd": [
    "ssfd"
  ],
  "db": [
    "dbq"
  ],
  "dbq": [
    "dbq"
  ],
  "sr": [
    "srds"
  ],
  "srd": [
    "srds"
  ],
  "srds": [
    "srds"
  ],
  "xd": [
    "xdm"
  ],
  "xdm": [
    "xdm"
  ],
  "cx": [
    "cxk"
  ],
  "cxk": [
    "cxk"
  ],
  "yyg": [
    "yygq"
  ],
  "yygq": [
    "yygq"
  ],
  "bl": [
    "blx"
  ],
  "blx": [
    "blx"
  ],
  "bai": [
    "bai",
    "baise"
  ],
  "hon": [
    "hongse"
  ],
  "hong": [
    "hongse"
  ],
  "lan": [
    "lanse"
  ],
  "lans": [
    "lanse"
  ],
  "lvs": [
    "lvse",
    "lvshi"
  ],
  "lvse": [
    "lvse"
  ],
  "hua": [
    "huangse"
  ],
  "huan": [
    "huangse"
  ],
  "hei": [
    "heise"
  ],
  "heis": [
    "heise"
  ],
  "bais": [
    "baise"
  ],
  "zis": [
    "zise"
  ],
  "zise": [
    "zise"
  ],
  "huis": [
    "huise"
  ],
  "fenh": [
    "fenhongse"
  ],
  "laos": [
    "laoshi"
  ],
  "yish": [
    "yisheng"
  ],
  "hus": [
    "hushi"
  ],
  "hush": [
    "hushi"
  ],
  "lvsh": [
    "lvshi"
  ],
  "sij": [
    "siji"
  ],
  "siji": [
    "siji"
  ],
  "fuw": [
    "fuwuyuan"
  ],
  "fuwu": [
    "fuwuyuan"
  ],
  "yany": [
    "yanyuan"
  ]
};
  const ZH_WORD_SET = new Set(ZH_WORDS);

  class ChineseSubDirectory {
    constructor() {
      this.name = 'Chinese Pinyin (中文)';
      this.code = 'zh';
      this.badge = '中文 Pinyin';
      this.icon = 'fa-dragon';
      this.wordSet = ZH_WORD_SET;
      this.typoMap = ZH_TYPO_MAP;
      this.prefixTable = ZH_PREFIX_TABLE;
      this.isActive = false;
    }

    hasWord(word) {
      if (!word) return false;
      return this.wordSet.has(word.toLowerCase().trim());
    }

    correctWord(cleanWord) {
      if (!cleanWord) return null;
      return this.typoMap[cleanWord] || null;
    }

    getPrefixSuggestions(prefix, max = 4) {
      if (!prefix || prefix.length < 2) return [];
      const clean = prefix.toLowerCase();
      const p = clean.slice(0, Math.min(4, clean.length));
      return (this.prefixTable[p] || []).filter(w => w.startsWith(clean) && w !== clean).slice(0, max);
    }

    detect(text) {
      if (!text || typeof text !== 'string') return false;
      const lower = text.toLowerCase();
      const tokens = lower.split(/\s+|[.,!?;:()]+/);
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i].trim();
        if (this.typoMap[t]) return true;
      }
      return /\b(nihao|xiexie|zaijian|weishenme|shenme|duibuqi|meiguanxi|haode|zenmeyang|yyds|xswl|zqsg|dddd|plmm)\b/i.test(lower);
    }

    activate() {
      this.isActive = true;
      if (typeof window !== 'undefined') window.ZH_SUBDIRECTORY_ACTIVE = true;
    }

    deactivate() {
      this.isActive = false;
      if (typeof window !== 'undefined') window.ZH_SUBDIRECTORY_ACTIVE = false;
    }
  }

  const zhSubDir = new ChineseSubDirectory();

  window.ZH_WORDS = ZH_WORDS;
  window.ZH_TYPO_MAP = ZH_TYPO_MAP;
  window.ZH_WORD_SET = ZH_WORD_SET;
  window.ZH_PREFIX_TABLE = ZH_PREFIX_TABLE;
  window.ZH_SUBDIRECTORY = zhSubDir;
})();
