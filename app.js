let qcloud = require('./vendor/qcloud-weapp-client-sdk/index');
let ZgConfig = require('ZgConfig.js');
let ut = require('utils/utils.js');
const updateManager = wx.getUpdateManager();

App({
    //全局参数的顺序：系统信息、用户信息、运行时信息、应用的全局参数。按照从稳定到活跃的顺序安排。
    globalData: {

        /**
         * 系统信息
         */
        sysInfo: {},    //用户的手机终端环境信息，app初始化时获取


        /**
         * 用户信息
         */
        userInfo: null, //初始情况下用户信息为null，点击登录按钮后，从后台获取
        address: {},    //用户的地址文字。使用腾讯地图api根据当前地理坐标反向解析获取
        location: {},   //用户的地址坐标。

        /**
         * 运行时信息
         */
        cf:{},          //小程序启动时根据传入index的runmode参数（dev|test|prod）初始化cf(config)

        /**
         * 应用的全局参数
         */
        entryType: 'NORMAL',//进入首页的模式：默认为NORMAL，当会话超时后，则被设置为SESSION_TIMEOUT，当会话再次被刷新后，则又被设置为NORMAL
        gReqType: '',   //目前只用来验证

    },


    /**
     * 应用程序启动例行操作：
     * 1、获取手机系统信息、地理坐标和地点
     * 2、获取系统信息、用户地理信息
     */
    onLaunch: function (options) {

        //如未指定运行模式，则默认为生产模式
        const runmode = options.query.runmode ? options.query.runmode:'prod';
        console.log('runmode',runmode);

        //根据小程序的启动参数，初始化运行时参数
        this.globalData['cf']=new ZgConfig(runmode);


        let that = this;

        //获取用户手机的系统信息
        wx.getSystemInfo({
            success: function (res) {
                that.globalData.sysInfo = res;
            }
        });

        //使用腾讯地图api获得地理信息获取用户的地理坐标
        wx.getLocation({
            type: 'gcj02', //返回可以用于wx.openLocation的经纬度
            success: function (res) {
                let location = {
                    'latitude': res.latitude,
                    'longitude': res.longitude
                };
                that.globalData.location = location;

                //根据坐标获得用户地址
                ut.getAddress(location,function(result){
                    that.globalData.address = result;
                });
            },
            fail: function (res) {
                console.error('获取位置发生错误',res);
            },
        });



        //20180604，支持更新检查
        //官文参考：
        // 1、https://developers.weixin.qq.com/miniprogram/dev/api/getUpdateManager.html
        // 2、https://developers.weixin.qq.com/blogdetail?action=get_post_info&lang=zh_CN&token=1491144534&docid=000c2430d30b70251e86f0a0256c09&inwindow=1
        updateManager.onCheckForUpdate(function (res) {
            // 请求完新版本信息的回调
            console.log('MP更新状态！',res.hasUpdate);
        });

        updateManager.onUpdateReady(function () {
            wx.showModal({
                title: '更新提示',
                content: '新版本已经准备好，是否重启应用？',
                success: function (res) {
                    if (res.confirm) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate()
                    }
                }
            })

        });

        updateManager.onUpdateFailed(function () {
            // 新的版本下载失败
            console.log('MP更新失败！');
        })

    },

    /**
     * 获取用户信息。在index中调用。
     * 1、如已获取用户信息，则直接返回用户信息，在cb回调函数中可以访问。
     * 2、如未尚未获取用户信息，则执行登录流程，登录过程中将微信服务器返回的数据保存在globalData中
     *   1）调用wx.login接口获取CODE
     *   2）调用wx.getUserInfo接口获取用户加密数据
     *   3）调用后端自定义登录接口(bizUser.login2)，获取openId并生成会话session3rd
     *   4）收到会话session3rdKey并保留在本地作为缓存
     * @param cb
     */
    getUserInfo: function (cb) {
        let that = this;


        if (this.globalData.userInfo) {
            ut.debug('app.getUserInfo-1:true', cb);
            typeof cb === "function" && cb(this.globalData.userInfo)
        } else {
            ut.debug('app.getUserInfo-2:false');

            //1)调用wx登录接口，获取code
            wx.login({
                success: function (res) {
                    ut.debug('app.getUserInfo-3', res);

                    //2)调用wx.getUserInfo获取加密信息encryptedData，iv，userInfo
                    wx.getUserInfo({

                        withCredentials: true,   //获取用户的秘密信息，便于发给后端生成session3rd

                        success: function (res2) {
                            ut.debug('app.getUserInfo-4', res2);

                            //取得非敏感的userInfo后，保存到共享数据区
                            that.globalData.userInfo = res2.userInfo;


                            //3)准备参数用来获取openId和生成会话
                            let _code = res.code;
                            let _encryptedData = res2.encryptedData;
                            let _iv = res2.iv;

                            //调用后端的登录校验服务，获得session
                            wx.request({
                                url: that.globalData.cf.service.loginUrl2,
                                data: {
                                    code: _code,
                                    encryptedData: _encryptedData,
                                    iv: _iv
                                },
                                success: function (res) {
                                    ut.debug('doLogin-2,应答', res);

                                    //4)将session3rd写入本地缓存
                                    wx.setStorageSync('session3rdKey', res.data.session3rdKey);
                                    let session3rdKey = wx.getStorageSync('session3rdKey') || '';

                                    //将openId保存到userInfo的属性中，便于引用
                                    that.globalData.userInfo.openId = res.data.openId;

                                    //将首页的访问入口类型设置为NORMAL，避免在会话有效期内重复刷新。
                                    that.globalData.entryType = 'NORMAL';

                                    //回调设置用户数据
                                    typeof cb === "function" && cb(that.globalData.userInfo)
                                },
                                fail: function (res) {
                                    ut.error('oaerr,生成会话错误。请确认网络是否畅通。', res);
                                }
                            })
                        }
                    })
                },
            });
        }
    },

    /**
     * 功能：
     * 1、根据本地storage保存的用户信息向后台查询用户信息。并对用户信息进行处理。
     * 2、后台收到本接口后，会记录访问日志，如果是新用户则会增加一条，如为老用户，则会应答最新用户信息。
     * 场景：
     * 1、index中，sessnion未过期的老用户访问首页时，校验会话是否过期
     * 2、老用户修改访问首页时刷新用户信息
     * 3、需要的场景下可以用此函数获取完整的用户信息
     * @param cb
     */
    checkUser: function (cb) {

        console.log('checkUser: userInfo is ',wx.getStorageSync('userInfo'));
        let that = this;
        //检查是否是新用户
        wx.request({
            url: that.globalData.cf.service.userCheckUrl,
            data: {
                userInfo: wx.getStorageSync('userInfo') //that.globalData.userInfo
            },
            header: {
                'session3rdKey': wx.getStorageSync('session3rdKey'),
            },
            success: function (res) {
                cb(res);
            }
        });
    },

    /**
     * 功能：检查用户是否为新用户，如是新用户，则引导客户注册
     * 场景：
     * 1、LBOR上单时
     * 2、CLNT下单时
     */
    isNewUser: function () {
        if (this.globalData.newUser) {
            wx.showModal({
                title: '提示',
                content: '尚未注册，马上去注册？',
                success: function (res) {
                    if (res.confirm) {
                        wx.navigateTo(
                            {
                                url: '../user-edit/user-edit'
                            }
                        );
                    } else if (res.cancel) {
                        console.log('用户点击取消')
                    }
                }
            });
        }
    },


    /**
     * 统一配置各页面中的标题和描述信息
     * @param pageName
     * @returns 页面文件中的标题和说明
     */
    getPageInfo: function (pageName) {
        let ret = {};
        let cf = this.globalData.cf;
        for (let i = 0; i < cf.pageInfo.length; i++) {

            if (pageName === cf.pageInfo[i].page) {
                Object.assign(ret, cf.pageInfo[i]);
                break;
            }
        }
        return ret;
        //TODO:此函数用的遍历算法效率较低，应考虑重构为对象方式访问，而不是以数组方式访问。
    },

    /**
     * 获得ZgConfig中的对象，便于通过.操作符获取静态参数
     * @returns {*}
     */
    getSConfig: function () {
        return new ZgConfig('dev');
    }

    ,
    /**
     * 用户点击关于页面的下方的首页连接时，返回
     */
    goHome: function () {
        wx.switchTab({
            url: '../../pages/index/index?runmode='+this.globalData.cf.runMode
        });
    },


    onError: function (e) {
        //TODO:将异常信息联通新系统用户信息发送到后台，记录异常日志。
        ut.debug('app.js on Error', e);
    },


    /**
     * wafer1登录模式，wafer1和wafer2的登录模式有待验证。在本程序中暂不使用
     */
    doLoginWafer1: function () {

        //TODO:wafer1和wafer2的登录模式有待验证。
        qcloud.login({
            success(result) {
                console.log('登录成功', result);
            },
            fail(error) {
                console.log('登录失败', error);
            }
        });
    },

    /**
     * 获取全局参数的值
     * 场景：在自定义组件中使用该方法获取主调程序设置的全局参数
     * @param key
     * @returns {*}
     */
    getGlobalParam:function (key) {
        return this.globalData['gp_'+key];
    },

    /**
     * 设置全局参数的值
     * @param key
     * @param value
     */
    setGlobalParam:function (key,value) {
        this.globalData['gp_'+key] = value;
    },


});
