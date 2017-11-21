'use strict';


/**
 * 取得今天的日期
 */
exports.getToday = function () {
    return fmd(new Date(), 'yyyyMMdd');
};

/**
 * 取得今天的日期，可以指定分隔符
 */
exports.getToday = function (delimiter) {
    return fmd(new Date(), 'yyyy' + delimiter + 'MM' + delimiter + 'dd');
};

/**
 * 取得现在的时间
 */
exports.getNow = function () {
    return fmd(new Date(), 'hhmmss');
};

/**
 * 取得现在的时间，可以指定分隔符
 */
exports.getNow = function (delimiter) {
    return fmd(new Date(), 'hh' + delimiter + 'mm');
};

function fmd(date, style) {
    let y = date.getFullYear();
    let M = "0" + (date.getMonth() + 1);
    M = M.substring(M.length - 2);
    let d = "0" + date.getDate();
    d = d.substring(d.length - 2);
    let h = "0" + date.getHours();
    h = h.substring(h.length - 2);
    let m = "0" + date.getMinutes();
    m = m.substring(m.length - 2);
    let s = "0" + date.getSeconds();
    s = s.substring(s.length - 2);
    return style.replace('yyyy', y).replace('MM', M).replace('dd', d).replace('hh', h).replace('mm', m).replace('ss', s);
}


//日志级别
let logLevel = {
    FATAL:5,
    ERROR:4,
    WARN:3,
    INFO:2,
    DEBUG:1,
    LEVEL:1, //生产环境中需要排查问题时，可以将LEVEL调低到1，正常生产情况下LEVEL应为3或2
    TYPE:'front' //front表示前端日志，直接输出对象；backend表示服务端日志，需要将对象转成字符串
};
exports.error = function (desc, obj) {
    log(logLevel.ERROR,'error',arguments);
};
exports.warn = function (desc, obj) {
    log(logLevel.WARN,' warn',arguments);
};
exports.info = function (desc, obj) {
    log(logLevel.INFO,' info',arguments);
};
exports.debug = function () {
    log(logLevel.DEBUG,'debug',arguments);
};

function log (level,levelDesc,args) {
    if (logLevel.LEVEL <= level) {
        let now = fmd(new Date(), 'hhmmss');

        console.log(now + '-['+levelDesc+'] :========================================================');
        for (let i = 0; i < args.length; i++) {
            //若配置为前端使用的日志，则直接打印对象，便于查看。若配置为后端使用的日志，则将内容格式化后输出
            if('front'===logLevel.TYPE){
                console.log(args[i]);
            }else if('backend'===logLevel.TYPE){
                console.log(JSON.stringify(args[i],null,'\t'));
            }
        }
    }
};





/**
 * 检查一个字符串是否为数字
 * @param str
 * @returns {boolean}
 */
exports.isNumber = function (str) {
    let a = parseFloat(str);

    if (isNaN(a))
    //log(str +' is not number '+a);
        return false;
    else
    //log(str +' is  number '+a);
        return true;

};




