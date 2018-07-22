'use strict';

const MAP_KEY_TX = 'ZOUBZ-HID6G-SCPQS-I6A4Q-BHPKT-L2BIC';

//也可使用第三方模块获得随机数 https://github.com/chancejs/chancejs
let randomString = function(len) {
    len = len || 32;    //这个默认复制的方式很帅
    let chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    let maxPos = chars.length;
    let pwd = '';
    for (let i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd.toUpperCase();
};
exports.randomString  = function (len){
    return randomString(len);
};
exports.getSmsCode = function (){
    return randomString(4);
};

let hasStored = function (key){
    return ''!==wx.getStorageSync(key)
};
exports.hasStored = function(key){
    return hasStored(key);
};


exports.showTopTips = function (that,topTips,focusName,cf) {

    that.setData({
        showTopTips: true,
        topTips: topTips, //此处与字段相关，应可配置
        [focusName]:true, //中括号表示动态从参数中获取
        submitButtonDisabled: false
    });
    setTimeout(() => {
            that.setData({
                showTopTips: false,
            });
        }
        , cf.vc.ToastShowDurt);
};


/**
 * 手机号是否合法
 * @param str
 * @returns {boolean}
 */
let isPoneAvailable = function(str) {

    let myreg=/^[1][3-9][0-9]{9}$/;   //另一个校验规则：/^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8})$/
    console.log('校验手机号格式',str,myreg.test(str));
    return myreg.test(str)
};
exports.isPoneAvailable  = function(str){
    return isPoneAvailable(str);
};


/**
 * 功能：
 * 1、判断前端页面是否准入：新增、修改类功能页面加载时（onload)，前端校验userInfo是否有效。
 *    典型案例：我的(me.js)
 * 2、判断后端会话是否有效：新增、修改类功能点击提交后（onsubmit)，在wx.request收到应答后，校验后端会话是否有效。
 *    典型案例：订单提交(rqst-edit.js)
 *
 * 场景：
 * 1、个人类业务信息的新建、修改（如我的、用户信息修改、提交订单）、查等，需将3rdsessionkey作为head参数发送到后端，并在wx.request应答中调用本函数检查后端会话。
 * 3、用户访问首页时。
 *
 * 公开类信息展现的处理方式：
 * 1、公开类业务信息页面加载数据时，无需调用本函数来校验本地会话，更不必校验后端会话，故无需将3rdsessionkey作为head参数发送到后端
 * 2、后端收到不含3rdsessionKey的请求，将不对会话有效性检查。
 *
 * @param res1  当用作页面准入判断时设置为null；当用作后端会话有效性检查时，将wx.request应答的res作为参数
 * @param app
 * @param that  当前类的句柄
 * @param cb    在会话有效的情形下被调用，通常是渲染数据、更新页面控件的状态
 */
exports.checkSession = function (res1, app, that, cb) {
    console.log('res1',res1,'app',app.globalData.userInfo);
    let desc = '';
    let redirect  = false; //默认为会话有效

    //页面准入场景
    if(!app.globalData.userInfo){
        desc = '您尚未登录，请登录后使用。';
        redirect = true;
    }
    //后端会话有效性校验场景
    else if (res1){
        if(res1.header.RTCD === 'RTCD_SESSION_TIMEOUT'){
            desc = '会话已超时，请登录后使用。';
            redirect = true;
        }
    }

    //根据前面的条件判断是否要跳转
    if (redirect) {
        // wx.showModal({
        //     title: '提示',
        //     content: desc,
        //     success: function (res) {
        //         if (res.confirm) {
        //             app.globalData.entryType = 'SESSION_TIMEOUT';
        //             wx.switchTab(
        //                 {
        //                     url: '../index/index'
        //                 }
        //             );
        //         } else if (res.cancel) {
        //             app.globalData.entryType = 'SESSION_TIMEOUT';
        //             wx.switchTab(
        //                 {
        //                     url: '../index/index'
        //                 }
        //             );
        //         }
        //     }
        // });
    } else {
        cb();
    }
};

/**
 * 功能：根据外层的逻辑条件，显示confirm对话框
 * 场景：需要用户做出选择时
 * @param title     主要提示内容 TODO:（1）规范措辞风格（2）国际化
 * @param content   次要提示内容，可以选择输入''
 * @param confirmCb 选择确定后的动作
 * @param cancelCb  选择取消时的动作
 */
exports.showModal = function (title,content, confirmCb,cancelCb) {
        wx.showModal({
            title: title,
            content: content,
            success: function (res) {
                if (res.confirm) {
                    confirmCb();
                } else if (res.cancel) {
                    cancelCb()
                }
            }
        });
};

/**
 * 功能：上传文件
 * 场景：上传图片，可结合wxml中的图片显示控制参数和按钮使用。
 * 案例：个人信息修改中的身份证上传功能
 * @param uploadSrvUrl 文件上传服务
 * @param cb 对上传路径、文件名进行处理
 */
exports.uploadFile= function (uploadSrvUrl,cb) {

    wx.chooseImage({
        sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
        sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
        success: function (res) {
            let tempFilePaths = res.tempFilePaths;
            wx.uploadFile({
                url: uploadSrvUrl,
                filePath: tempFilePaths[0],
                name: 'avatar',
                formData: {
                    'user': 'testusername'
                },
                header: {
                    'session3rdKey': wx.getStorageSync('session3rdKey'),
                },
                success: function (res) {
                    console.debug(res);

                    //后台生成的文件名
                    let fn = res.data;
                    let backEndFilePath = uploadSrvUrl + '/' + fn;
                    console.debug('后台文件路径' + backEndFilePath);


                    //对上传的文件、路径、应答进行处理
                    cb(fn,backEndFilePath,res);

                },
                fail: function (res) {
                    console.error("上传失败：", res.data)
                }
            });
        }
    })
};

/**
 * 功能：提示处理结果
 * 场景：表单提交后展示处理结果
 * @param title 显示的信息
 */
exports.showToast = function (title) {
    wx.showToast({
        title: title,
        icon: 'success',
        duration: getApp().globalData.cf.vc.ToastShowDurt
    });
};

exports.alert = function (title, iconType) {
    wx.showToast({
        title: title,
        icon: iconType,
        duration: getApp().globalData.cf.vc.ToastShowDurt
    });
};

//onLoad()中调用
exports.showLoading = function () {
    wx.showLoading({
        title: getApp().globalData.cf.hint.H_LOADING,
    });
};
//onLoad()中调用
exports.hideLoading = function () {
    wx.hideLoading();
}
;
/**
 * 功能：跳转到某个tab页
 * @param toUrl
 */
exports.switchTab = function (toUrl) {
    setTimeout(function () {
        wx.switchTab({
            url: toUrl
        })
    }, getApp().globalData.cf.vc.ToastShowDurt);

};

exports.isInWhiteList = function isInWhiteList (mobile){
    let app = getApp();
    let ret = app.globalData.cf.whiteList.indexOf(mobile)>=0;
    console.log('aaaa===============',mobile,app.globalData.cf.whiteList,ret);

    return  ret;
};

/**
 * 功能：
 * 向后台发送request请求，将发送的请求数据封装在rdata中，便于请求参数的管理。
 *
 * 场景：
 * 调用后端业务服务的时候、调用第三方服务的时候。
 *
 * 流程、算法：
 *
 * @param url
 * @param rdata
 * @param successCb
 * @param failCb
 * @param checkSession 是否校验后台会话过期,如为true，后台将校验会话并
 */
exports.request = function(url,rdata,checkSession,successCb,failCb ){

    let header = {};
    if(checkSession)
        header = {
        'session3rdKey': wx.getStorageSync('session3rdKey'),
    };
    wx.request({
        url: url,
        data: {
            /**
             *  前端的参数通过rdata封装，不用在data中按输入域设置参数值，以减少前端代码量。
             *  后端程序通过let p = JSON.parse(req.query.rdata)，获得rdata对象，用p.name方式获取前端页面上输入的参数值
             */
            'rdata': rdata
        },
        header: header,
        success: function (res) {

            if(checkSession && res.header.RTCD === 'RTCD_SESSION_TIMEOUT'){
                wx.showModal({
                    title: '提示',
                    content: '会话已超时，马上去登录？',
                    success: function (res) {
                        if (res.confirm) {
                            app.globalData.entryType = 'SESSION_TIMEOUT';
                            wx.switchTab(
                                {
                                    url: '../index/index'
                                }
                            );
                        } else if (res.cancel) {
                            console.log('用户点击取消')
                        }
                    }
                });
            }else{
                successCb(res);
            }
        },
        fail:function (res) {
            failCb(res);
        },
        complete: function (res) {
            console.log("request发送完成",res);
        }
    })
};



/**
 * 根据输入的内容，显示出下拉列表中的建议地址
 * @param e
 * @param addressPropName 用户选中某个建议的地址时显示的内容
 * @param addressList 建议地址列表，在WXML中的列表属性名应与此相同
 * @param _this
 */
exports.setAddress = function (e, addressPropName, addressList, _this) {

    let that = _this;
    if (e.detail.value === '') {
        that.setData({
            addressPropName: ''
        });
        return;
    }
    // 引入SDK核心类
    let QQMapWX = require('../vendor/qqmap-sdk/qqmap-wx-jssdk.js');

    // 实例化API核心类
    let demo = new QQMapWX({
        key: MAP_KEY_TX // 必填
    });

    // 调用接口
    demo.getSuggestion({
        keyword: e.detail.value,
        city: '上海',     //搜索的城市范围，如不设置，则搜索全国
        region_fix: 1,   //仅限当前城市范围内搜索关键字，0表示自动扩展到全国范围
        policy: 1,       //根据地址使用热度排序，适合上门服务类、快递地址，体验更好
        success: function (res) {
            console.log('setAddress:',res);

            let data = res.data;
            let sugData = [];
            for (let i = 0; i < data.length; i++) {
                sugData.push({'title':data[i].title,'address':data[i].address,'location':data[i].location});
                //sugData.push(data[i].address);
            }
            that.setData({
                addressList: sugData
            });
        },
        fail: function (res) {
            console.log('OAERROR：', res);
        },
        complete: function (res) {
            console.log(res);
            console.log('complete',that.data.addressList);
        }
    });
};


/**
 * 坐标->地址
 * @param location  :地理坐标{'latitude': latitude,'longitude': longitude}
 * @param key       :开发者key
 */
exports.getAddress4tx = function (location, key) {
    // 引入SDK核心类
    let QQMapWX = require('../vendor/qqmap-sdk/qqmap-wx-jssdk.js');

    // 实例化API核心类
    let demo = new QQMapWX({
        key: key // 必填
    });

    // 调用接口
    demo.reverseGeocoder({
        location: location,
        success: function (res) {
            console.log('坐标->地址，成功', res);
            return res;
        },
        fail: function (res) {
            console.log('坐标->地址，失败', res);
            return res;
        },
        complete: function (res) {
            console.log('complete', res);
        }
    });
};


exports.getLocation4tx = function (address, key,cb) {
    // 引入SDK核心类
    let QQMapWX = require('../vendor/qqmap-sdk/qqmap-wx-jssdk.js');

    // 实例化API核心类
    let demo = new QQMapWX({
        key: key // 必填
    });

    // 调用接口
    demo.geocoder({
        address: address,
        success: function(res) {
            console.log('地址->坐标，成功', res);
            cb(res);
        },
        fail: function(res) {
            console.log('地址->坐标，失败',res);
        },
        complete: function(res) {
            console.log(res);
        }
    });
};



/**
 * 根据地址描述获得地址对象
 * @param address :地址
 * @param cb :获取地址对象后的回调函数
 */
let getLal4tx = function (address, cb) {
    // 引入SDK核心类
    let QQMapWX = require('../vendor/qqmap-sdk/qqmap-wx-jssdk.js');

    // 实例化API核心类
    let demo = new QQMapWX({
        key: MAP_KEY_TX // 必填
    });

    // 调用接口
    demo.geocoder({
        address: address,
        success: function (res) {
            console.log('地址->坐标转换成功', res);
            cb(res)
        },
        fail: function (res) {
            console.log(address,'地址->坐标转换失败', res);
        }
    });
};

exports.getLal4tx = function (address, cb) {
    return getLal4tx(address, cb);
};

exports.getLongSize = function (mode, from, to, cb) {
    return getLongSize(mode, from, to, cb);
};

let getLongSize = function (mode, from, to, cb) {

    // 引入SDK核心类
    let QQMapWX = require('../vendor/qqmap-sdk/qqmap-wx-jssdk.js');

    // 实例化API核心类
    let demo = new QQMapWX({
        key: MAP_KEY_TX // 必填
    });

    demo.calculateDistance({
        mode: mode,
        from: {
            latitude: from.lat,
            longitude: from.lng
        },
        to: [{
            latitude: to.lat,
            longitude: to.lng
        }],
        success: function (res) {
            console.log('两地距离为：', res);
            cb(res);
        },
        fail: function (res) {
            console.log(res);
        },

    });
};


/**
 * 根据两个地址，得出地之间的距离和行进速度。
 * @param addrFrom 出发地
 * @param addrTo  目的地
 * @param cb
 */
let getTraffic4tx = function (addrFrom, addrTo, cb) {

        getLal4tx(addrFrom, function (resf) {
            getLal4tx(addrTo, function (rest) {

                //无论入参是什么，默认都是按照驾驶速度取得初始的耗时。

                getLongSize('driving', resf.result.location, rest.result.location, function (resd) {

                    let distance = resd.result.elements[0].distance / 1000;
                    let duration = resd.result.elements[0].duration / 60;


                    //骑车与步行的默认时速
                    let VofRidding = 15;    //骑行
                    let VofWalking = 4.5;     //步行

                    let durationDriving = duration;
                    let durationRidding = (distance / VofRidding)*60; // 骑车行程时间(分钟)=距离/时速
                    let durationWalking = (distance / VofWalking)*60; // 步行行程时间(分钟)=距离/时速


                    //将精度设置为保留两位小数
                    let ret = {

                        durationDriving:durationDriving.toFixed(0),
                        durationRidding:durationRidding.toFixed(0),
                        durationWalking:durationWalking.toFixed(0),

                        distance: distance.toFixed(2)
                    };
                    console.log(addrFrom + '->' + addrTo + ':', ret);
                    cb(ret);
                })
            })
        });

};

exports.getTraffic4tx = function ( addrFrom, addrTo, cb) {
    return getTraffic4tx(addrFrom, addrTo, cb);
};

/**
 * 根据地址明文转换成密文，数字用*号替代
 * @param addr 地址明文
 * @returns {string|*|void|XML} 地址密文
 */
exports.getHiddenAddr = function (addr) {
    console.log(addr,addr.replace(/[\d]/g, '*'));
    return addr.replace(/[\d]/g, '*');
};

/**
 * 将getLocation函数获取的经纬度信息，转换为度和分
 * @param longi
 * @param lati
 * @returns {{longitude: Array, latitude: Array}}
 */
exports.formatLocation = function (longi, lati) {
    if (typeof longi === 'string' && typeof lati === 'string') {
        longi = parseFloat(longi);
        lati = parseFloat(lati);
    }

    return {
        longitude: longi.toFixed(2).toString().split('.'),
        latitude: lati.toFixed(2).toString().split('.')
    }

};
/**
 * 用数据库中保存的值来渲染data中默认的单选checkbox数组
 * @param propName 数据库中保存的值
 * @param rbArray data对象中默认的数组（items），如this.data.items
 * @returns {*} 被渲染后的数组。
 */
exports.getRa = function (propName, rbArray) {
    let items = rbArray;
    for (let i = 0; i < items.length; i++) {
        if (items[i].name === propName) {
            items[i].checked = true;
            console.log(items[i].name + '被设置为true');
        } else {
            delete items[i].checked;
        }
    }
    return items;
};

/**
 * 根据数据库中的数据渲染页面上的checkbox多选控件
 * @param checkboxList 页面.js中checkbox控件中的值，value存代码，name存描述
 * @param valueListFromDb 从数据库中获取的仅含value的数组
 * @returns {*}
 */
exports.renderCheckbox = function (checkboxList, valueListFromDb) {

    //先清除控件的默认选中情况，再根据数据库中的数值渲染。
    checkboxList.map((item1,index1)=>{
        delete item1.checked;//清除控件的默认选中情况

        valueListFromDb.map((value2,index2)=>{
            console.log(index1,index2,item1.value,value2);
            if(item1.value===value2){
                item1['checked']=true;
            }
        });
    });

    console.debug('after render:',checkboxList);
    return checkboxList;

};


/**
 * 根据数据库中的UTC日期对象，显示与目前时间的距离
 * @param time_str
 * @returns {*}
 */
exports.getTimeShow = function (time_str) {
    //debugger;
    let now = new Date();
    let date = new Date(time_str);
    //计算时间间隔，单位为分钟
    let inter = parseInt((now.getTime() - date.getTime()) / 1000 / 60);

    if (inter < -60 * 24) {
        return parseInt(inter / 60).toString() + "小时后";
    }
    else if (inter <= -60) {
        return inter.toString() + "分钟后";
    }
    else if (inter === 0) {
        return "刚刚";
    }
    //多少分钟前
    else if (inter < 60) {
        return inter.toString() + "分钟前";
    }
    //多少小时前
    else if (inter < 60 * 24) {
        return parseInt(inter / 60).toString() + "小时前";
    }
    //本年度内，日期不同，取日期+时间  格式如  06-13 22:11
    else if (now.getFullYear() === date.getFullYear()) {
        return (date.getMonth() + 1).toString() + "-" +
            date.getDate().toString() + " " +
            date.getHours() + ":" +
            date.getMinutes();
    }
    else {
        return date.getFullYear().toString().substring(2, 3) + "-" +
            (date.getMonth() + 1).toString() + "-" +
            date.getDate().toString() + " " +
            date.getHours() + ":" +
            date.getMinutes();
    }
};

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
    FATAL: 5,
    ERROR: 4,
    WARN: 3,
    INFO: 2,
    DEBUG: 1,
    LEVEL: 1, //生产环境中需要排查问题时，可以将LEVEL调低到1，正常生产情况下LEVEL应为3或2
    TYPE: 'front' //front表示前端日志，直接输出对象；backend表示服务端日志，需要将对象转成字符串
};
exports.error = function (desc, obj) {
    log(logLevel.ERROR, 'error', arguments);
};
exports.warn = function (desc, obj) {
    log(logLevel.WARN, ' warn', arguments);
};
exports.info = function (desc, obj) {
    console.log();
    log(logLevel.INFO, ' info', arguments);
};
exports.debug = function () {
    console.log();
    log(logLevel.DEBUG, 'debug', arguments);
};

function log(level, levelDesc, args) {
    if (logLevel.LEVEL <= level) {
        let now = fmd(new Date(), 'hhmmss');

        console.log(now + '-[' + levelDesc + '] :========================================================');
        for (let i = 0; i < args.length; i++) {
            //若配置为前端使用的日志，则直接打印对象，便于查看。若配置为后端使用的日志，则将内容格式化后输出
            if ('front' === logLevel.TYPE) {
                console.log(args[i]);
            } else if ('backend' === logLevel.TYPE) {
                console.log(JSON.stringify(args[i], null, '\t'));
            }
        }
    }
}


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

//console.log(require('./utils').getLal4tx('上海市浦东新区来安路500号'));

/**
 * 根据坐标将对应的地址描述进行处理
 * @param location  坐标
 * @param cb 地址文字描述
 */
exports.getAddress= function (location,cb) {
    // 引入SDK核心类
    let QQMapWX = require('../vendor/qqmap-sdk/qqmap-wx-jssdk.js');

    // 实例化API核心类
    let demo = new QQMapWX({
        key: 'ZOUBZ-HID6G-SCPQS-I6A4Q-BHPKT-L2BIC'
    });

    // 调用接口
    demo.reverseGeocoder({
        location: location,
        success: function (res) {
            console.log('用户地址=================：', res);
            cb(res.result);
        },
        fail: function (res) {
            console.error('fail', res);
        }
    });
};

exports.isLateThanNow=function(then){

    let thenDate = new Date(then);
    let now = new Date();

    console.log('thenDate:'+thenDate,'nowDate:'+now);
    return thenDate.getTime()-now.getTime()>0
};


exports.getLater=function(hours,hasSecond,interval){
    let then= new Date(new Date().getTime()+hours*60*60*1000);
    let thenTime = fmd(then,'hh:mm:ss');

    let ret = {date:fmd(then,'yyyy-MM-dd'),time:hasSecond ? thenTime:thenTime.substring(0,thenTime.lastIndexOf(':'))};

    console.log('那时',then,'结果',ret);
    return ret ;
};




