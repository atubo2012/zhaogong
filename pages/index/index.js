let ut = require('../../utils/utils.js');
let app = getApp();
let cf = app.globalData.cf;


Page({
    data: {
        pageInfo: app.getPageInfo('index'),
        motto: '',
        userInfo: {},
        isLogined: false,//默认状态为未登录，该属性控制显示“微信登录”按钮还是“业务功能按钮”
        stUserInfo: wx.getStorageSync('userInfo'),
        code: ''
    },

    /**
     * 根据场景类别加载页面
     * 1、用户第一次打开时，没有本地缓存的userInfo，只显示登录按钮
     * 2、用户因为后台超时，被重定向到本页面，只显示登录按钮
     */
    onLoad: function (option) {
        let that = this;

        //根据运行时参数，初始化，下面两行代码仅用作特性验证
        // app.globalData['runMode']=option.runmode;
        // app.globalData['cf'] = new ZgConfig(option.runmode);
        // cf = app.globalData['cf'];


        console.debug(
            '================',
            '\napp=', app,
            '\napp.globalData.entryType=', app.globalData.entryType,
            '\ngetStorageSync(\'userInfo\')=', wx.getStorageSync('userInfo'),ut.hasStored('userInfo'),
            '\ngetStorageSync(\'session3rdKey\')=', wx.getStorageSync('session3rdKey'),
            '\nuserInfo=', this.data.userInfo,
            '\n当前登录状态：',ut.hasStored('userInfo'),
            '\n^^^^^^^^^^^^^^^^'
        );


        /**
         * 以下两种情况下显示登录按钮
         * 1、用户第一次访问（本地尚未缓存userInfo）的情形下，则只显示登录按钮
         * 2、因为session超时被重定向到本页面
         */
        if (!ut.hasStored('userInfo') || //本地尚无用户信息，说明是用户第一次访问
            app.globalData.entryType === 'SESSION_TIMEOUT' ){//由于后端程序会话超时导致的加载首页
            that.setData({
                isLogined: false
            });
        } else {
            /**
             * 使用本地缓存的userInfo向后台发起用户信息查询，刷新app.globalData.userInfo。
             * 若会话已超时，设置app.globalData.entryType ==='SESSION_TIMEOUT'后重新加载本页面，并只显示登陆按钮
             * 若会话未超时，则将后台的用户数据拉到本地，更新userInfo。
             */
            app.checkUser((res) => {
                ut.checkSession(res, app, that, function (params2) {

                    app.globalData.userInfo = res.data;
                    that.setData({
                        isLogined: true,
                        userInfo: app.globalData.userInfo
                    });

                    let ret = JSON.stringify(res.data);
                    //如果后台返回的数据为空（）或者mobile字段尚未填写，则说明用户未注册，将用户标识为新用户。
                    if ("0" === ret || res.data.mobile === '') {
                        ut.debug('新用户，res.data:', res.data);
                        that.setData({
                            newUser: true
                        });
                        app.globalData.newUser = true;

                    } else {
                        ut.debug('老用户，res.data:', res.data);
                        that.setData({
                            newUser: false
                        });
                        app.globalData.newUser = false;
                    }
                    ut.debug('userInfo', app.globalData.userInfo);
                });
            });
        }
        /**
         * 检查本地是否存在曾经缓存的sessionData，如已存在说明曾经使用过小程序，直接显示业务功能按钮，否则显示微信登录按钮
         */
        /**
         let then = new Date(wx.getStorageSync('sessionData').ct);
         let now = new Date();
         console.log('session时差',(now-then));

         if (now-then <24*60*1000) {
            app.globalData.userInfo = wx.getStorageSync('userInfo');
            console.log('本地缓存的app.globalData',app.globalData);
            that.setData({
                isLogined: true
            });
        } else {
            //获取code，等待
            // wx.login({
            //     success: function (res) {
            //         ut.debug('wx.login', res);
            //         that.setData({
            //             code: res.code
            //         })
            //     },
            // });
            //检查是否是新用户
            wx.request({
                url: cf.service.userCheckUrl,
                data: {
                    userInfo: app.globalData.userInfo
                },
                header: {
                    'session3rdKey': wx.getStorageSync('session3rdKey'),
                },
                success: function (res2) {

                    let ret = JSON.stringify(res2.data);
                    app.globalData.userInfo = res2.data;

                    //如果后台返回的数据为空（）或者mobile字段尚未填写，则说明用户未注册，将用户标识为新用户。
                    if ("0" === ret || res2.data.mobile === '') {
                        ut.debug('新用户，res.data:', res2.data);
                        that.setData({
                            newUser: true
                        });
                        app.globalData.newUser = true;

                    } else {
                        ut.debug('老用户，res.data:', res2.data);
                        that.setData({
                            newUser: false
                        });
                        app.globalData.newUser = false;
                    }

                    ut.debug('userInfo', app.globalData.userInfo);
                    //检查用户是否已注册，本条语句是为测试。应在需要保留用户信息的时候调用以下语句，引导用户去注册。
                    //app.isNewUser();
                }
            });
        }
         */
        //调用应用实例的方法获取全局数据
        // app.getUserInfo(function (userInfo) {
        //
        //     //将当前用户信息设置为全局变量。在page的js中可以使用app.globalData.userInfo获取
        //     that.setData({
        //         userInfo: userInfo
        //     });
        //
        //     //检查是否是新用户
        //     wx.request({
        //         url: cf.service.userCheckUrl,
        //         data: {
        //             userInfo: app.globalData.userInfo
        //         },
        //         header: {
        //             'session3rdKey':wx.getStorageSync('session3rdKey'),
        //         },
        //         success: function (res) {
        //
        //             let ret = JSON.stringify(res.data);
        //
        //             app.globalData.userInfo = res.data;
        //
        //             //如果后台返回的数据为空（）或者mobile字段尚未填写，则说明用户未注册，将用户标识为新用户。
        //             if ("0" === ret || res.data.mobile==='') {
        //                 ut.debug('新用户，res.data:',res.data);
        //                 that.setData({
        //                     newUser: true
        //                 });
        //                 app.globalData.newUser = true;
        //
        //             } else {
        //                 ut.debug('老用户，res.data:',res.data);
        //                 that.setData({
        //                     newUser: false
        //                 });
        //                 app.globalData.newUser = false;
        //             }
        //
        //             ut.debug('userInfo',app.globalData.userInfo);
        //             //检查用户是否已注册，本条语句是为测试。应在需要保留用户信息的时候调用以下语句，引导用户去注册。
        //             app.isNewUser();
        //
        //         }
        //     });
        // });

        /**
         * TODO:
         * 1、识别是否为新用户
         * 2-1、如果是新用户，则将页面导航到Role（找帮手/找工作）
         * 3-1、选定角色后导航到reqList看需求单或svcType选择服务种类
         * 4-1、LB点击需求列表进入reqDetl，选择上单时，提示填写个人信息和档期。录入完后进入该需求单。
         * 4-2、HI选择svcType进入reqEdit，录入需求信息，提交后提醒已发给n个供应商，接单后短信提醒。
         *
         * 2-2、如果是老用户，则根据角色进入到reqList或svcType
         */
    },

    /**
     * 点击“登录”按钮后的登录处理。算法参考微信官方建议：https://developers.weixin.qq.com/blogdetail?action=get_post_info&lang=zh_CN&token=1398344993&docid=000c2424654c40bd9c960e71e5b009&comment_lvl=24
     *
     * 1、wx.login获取code
     * 2、将open-data获取的iv、encryptedData以及wx.login获取的code作为参数，发往后台执行登录操作
     * 3、将应答的openId补充到app.globalData.userInfo中，并缓存到本地，便于重新加载index.wxml时校验后台会话状态
     * 4、渲染本页面使用的userInfo和功能按钮。
     * 5、设置entryType=NORMAL，正常登录
     * 6、发起请求，识别用户是否为新用户。
     * @param e
     */
    login: function (e) {
        let that = this;

        //取得非敏感的userInfo后，保存到共享数据区
        app.globalData.userInfo = e.detail.userInfo;

        //登录取得code->获取openId->检查是否为新用户，如果为新用户则提示
        wx.login({
            success: function (res1) {

                //3)准备参数用来获取openId和生成会话
                let reqdata = {'code': res1.code, 'encryptedData': e.detail.encryptedData, 'iv': e.detail.iv};
                console.log('wx.login', reqdata);

                //调用后端的登录校验服务，获得session，缓存到本地
                wx.request({
                    url: cf.service.loginUrl2,
                    data: reqdata,
                    success: function (res) {
                        ut.debug('doLogin-2,应答==========================================', res);
                        if (res.data.ret === 'error') {
                            console.warn('认证失败，请再次发起一次认证');
                            ut.showToast('亲，使点劲点下按钮！');
                            //that.login(e);
                        } else {

                            //4)将session3rd写入本地缓存
                            wx.setStorageSync('session3rdKey', res.data.session3rdKey);


                            //将openId补充到userInfo中，便于引用（作为发往后台的查询参数）//TODO：可优化为向后台只发送session3rdkey，后台由此转换为openId，保护用户隐私
                            app.globalData.userInfo.openId = res.data.openId;
                            wx.setStorageSync('userInfo', app.globalData.userInfo); //app.checkUser查询用户时使用。

                            //将首页的访问入口类型设置为NORMAL，避免在会话有效期内重复刷新。
                            app.globalData.entryType = 'NORMAL';

                            //登录成功后显示功能按钮
                            that.setData({
                                isLogined: true,
                                userInfo: app.globalData.userInfo
                            });


                            //检查是否是新用户，新用户则创建一条记录，老用户则返回老用户的记录（包括手机、角色等）
                            wx.request({
                                url: cf.service.userCheckUrl,
                                data: {
                                    userInfo: app.globalData.userInfo
                                },
                                header: {
                                    'session3rdKey': wx.getStorageSync('session3rdKey'),
                                },
                                success: function (res2) {

                                    let ret = JSON.stringify(res2.data);

                                    app.globalData.userInfo = res2.data;

                                    //如果后台返回的数据为空（）或者mobile字段尚未填写，则说明用户未注册，将用户标识为新用户。
                                    if ("0" === ret || res2.data.mobile === '') {
                                        ut.debug('新用户，res.data:', res2.data);
                                        that.setData({
                                            newUser: true
                                        });
                                        app.globalData.newUser = true;

                                    } else {
                                        ut.debug('老用户，res.data:', res2.data);
                                        that.setData({
                                            newUser: false
                                        });
                                        app.globalData.newUser = false;
                                    }

                                    //检查用户是否已注册，本条语句是为测试。应在需要保留用户信息的时候调用以下语句，引导用户去注册。
                                    app.isNewUser();
                                }
                            });
                        }
                    },
                    fail: function (res) {
                        ut.error('oaerr,生成会话错误。请确认网络是否畅通。', res);
                    }
                })
            },
        });
    },

    onLoad2: function () {
        let that = this;
        // wx.getSetting({
        //     success(res) {
        //         if (!res.authSetting['scope.userInfo']) {
        //             wx.authorize({
        //                 scope: 'scope.userInfo',
        //                 success() {
        //                     wx.getUserInfo({
        //                         success: function (res) {
        //                             console.log(res);
        //                         }
        //                     });
        //                 }
        //             })
        //         }
        //     }
        // });

        //会话超时场景或用户第一次访问（本地尚未缓存userInfo）的情形下，则只显示登录按钮，并自动获取code，以便登录时使用
        if (
            !wx.getStorageSync('userInfo') || //本地尚无用户信息，说明是用户第一次访问
            app.globalData.entryType === 'SESSION_TIMEOUT' //由于后端程序会话超时导致的加载首页
        ) {

            console.log('session为空');
            wx.login({
                success: (res) => {
                    console.log('res.code', res.code);
                    that.setData({
                        isLogined: false,
                        code: res.code
                    });
                }
            });
        } else {

            /**
             * 使用本地缓存的userInfo向后台发起会话时间校验。
             * 若会话已超时，设置app.globalData.entryType ==='SESSION_TIMEOUT'后重新加载本页面，并只显示登陆按钮
             * 若会话未超时，则将后台的用户数据拉到本地，更新userInfo。
             */
            app.checkUser(function (res) {
                console.log('app.checkUser=', res);
                ut.checkSession(res, app, that, function (params2) {

                    app.globalData.userInfo = res.data;
                    that.setData({
                        isLogined: true,
                        userInfo: app.globalData.userInfo
                    });

                    let ret = JSON.stringify(res.data);
                    //如果后台返回的数据为空（）或者mobile字段尚未填写，则说明用户未注册，将用户标识为新用户。
                    if ("0" === ret || res.data.mobile === '') {
                        ut.debug('新用户，res.data:', res2.data);
                        that.setData({
                            newUser: true
                        });
                        app.globalData.newUser = true;

                    } else {
                        ut.debug('老用户，res.data:', res.data);
                        that.setData({
                            newUser: false
                        });
                        app.globalData.newUser = false;
                    }
                    ut.debug('userInfo', app.globalData.userInfo);
                });
            });
        }
    },

    login2: function (e) {
        let that = this;
        console.log('开始登录=', e);
        console.log('that.data=', that.data);

        //取得非敏感的userInfo后，保存到共享数据区
        app.globalData.userInfo = e.detail.userInfo;

        let reqdata = {'code': that.data.code, 'encryptedData': e.detail.encryptedData, 'iv': e.detail.iv};
        console.log('wx.login', reqdata);

        //调用后端的登录校验服务，获得session，缓存到本地
        wx.request({
            url: cf.service.loginUrl2,
            data: reqdata,
            success: function (res) {
                ut.debug('doLogin-2,应答==========================================', res);
                if (res.data.ret === 'error') {
                    console.warn('认证失败，请再次发起一次认证');
                    ut.showToast('亲，使点劲点下按钮！');
                    //that.login(e);
                } else {

                    //4)将session3rd写入本地缓存
                    wx.setStorageSync('session3rdKey', res.data.session3rdKey);
                    //wx.setStorageSync('sessionData', res.data);

                    //将openId补充到userInfo中，便于引用（作为发往后台的查询参数）//TODO：可优化为向后台只发送session3rdkey，后台由此转换为openId，保护用户隐私
                    app.globalData.userInfo.openId = res.data.openId;
                    wx.setStorageSync('userInfo', app.globalData.userInfo);


                    //console.log('sessionData', wx.getStorageSync('sessionData'));
                    console.log(app.globalData);

                    //将首页的访问入口类型设置为NORMAL，避免在会话有效期内重复刷新。
                    app.globalData.entryType = 'NORMAL';


                    //登录成功后显示功能按钮
                    that.setData({
                        isLogined: true,
                        userInfo: app.globalData.userInfo
                    });


                    //检查是否是新用户，新用户则创建一条记录，老用户则返回老用户的记录（包括手机、角色等）
                    wx.request({
                        url: cf.service.userCheckUrl,
                        data: {
                            userInfo: app.globalData.userInfo
                        },
                        header: {
                            'session3rdKey': wx.getStorageSync('session3rdKey'),
                        },
                        success: function (res2) {

                            let ret = JSON.stringify(res2.data);

                            app.globalData.userInfo = res2.data;

                            //如果后台返回的数据为空（）或者mobile字段尚未填写，则说明用户未注册，将用户标识为新用户。
                            if ("0" === ret || res2.data.mobile === '') {
                                ut.debug('新用户，res.data:', res2.data);
                                that.setData({
                                    newUser: true
                                });
                                app.globalData.newUser = true;

                            } else {
                                ut.debug('老用户，res.data:', res2.data);
                                that.setData({
                                    newUser: false
                                });
                                app.globalData.newUser = false;
                            }

                            //ut.debug('app.globalData.userInfo', app.globalData.userInfo);
                            //检查用户是否已注册，本条语句是为测试。应在需要保留用户信息的时候调用以下语句，引导用户去注册。
                            app.isNewUser();
                        }
                    });
                }
            },
            fail: function (res) {
                ut.error('oaerr,生成会话错误。请确认网络是否畅通。', res);
            }
        })
    },

    login3: function (e) {
        let that = this;

        //取得非敏感的userInfo后，保存到共享数据区
        app.globalData.userInfo = e.detail.userInfo;

        //登录取得code->获取openId->检查是否为新用户，如果为新用户则提示
        wx.login({
            success: function (res1) {

                //3)准备参数用来获取openId和生成会话
                let reqdata = {'code': res1.code, 'encryptedData': e.detail.encryptedData, 'iv': e.detail.iv};
                console.log('wx.login', reqdata);

                wx.getUserInfo({
                    withCredentials: true,   //获取用户的秘密信息，便于发给后端生成session3rd
                    success: function (res2) {
                        reqdata = {'code': res1.code, 'encryptedData': res2.encryptedData, 'iv': res2.iv};
                        //调用后端的登录校验服务，获得session，缓存到本地
                        wx.request({
                            url: cf.service.loginUrl2,
                            data: reqdata,
                            success: function (res) {
                                ut.debug('doLogin-2,应答==========================================', res);
                                if (res.data.ret === 'error') {
                                    console.warn('认证失败，请再次发起一次认证');
                                    ut.showToast('亲，使点劲点下按钮！');
                                } else {

                                    //4)将session3rd写入本地缓存
                                    wx.setStorageSync('session3rdKey', res.data.session3rdKey);


                                    //将openId补充到userInfo中，便于引用（作为发往后台的查询参数）//TODO：可优化为向后台只发送session3rdkey，后台由此转换为openId，保护用户隐私
                                    app.globalData.userInfo.openId = res.data.openId;
                                    wx.setStorageSync('userInfo', app.globalData.userInfo); //app.checkUser查询用户时使用。

                                    //将首页的访问入口类型设置为NORMAL，避免在会话有效期内重复刷新。
                                    app.globalData.entryType = 'NORMAL';

                                    //登录成功后显示功能按钮
                                    that.setData({
                                        isLogined: true,
                                        userInfo: app.globalData.userInfo
                                    });


                                    //检查是否是新用户，新用户则创建一条记录，老用户则返回老用户的记录（包括手机、角色等）
                                    wx.request({
                                        url: cf.service.userCheckUrl,
                                        data: {
                                            userInfo: app.globalData.userInfo
                                        },
                                        header: {
                                            'session3rdKey': wx.getStorageSync('session3rdKey'),
                                        },
                                        success: function (res2) {

                                            let ret = JSON.stringify(res2.data);

                                            app.globalData.userInfo = res2.data;

                                            //如果后台返回的数据为空（）或者mobile字段尚未填写，则说明用户未注册，将用户标识为新用户。
                                            if ("0" === ret || res2.data.mobile === '') {
                                                ut.debug('新用户，res.data:', res2.data);
                                                that.setData({
                                                    newUser: true
                                                });
                                                app.globalData.newUser = true;

                                            } else {
                                                ut.debug('老用户，res.data:', res2.data);
                                                that.setData({
                                                    newUser: false
                                                });
                                                app.globalData.newUser = false;
                                            }

                                            //检查用户是否已注册，本条语句是为测试。应在需要保留用户信息的时候调用以下语句，引导用户去注册。
                                            app.isNewUser();
                                        }
                                    });
                                }
                            },
                            fail: function (res) {
                                ut.error('oaerr,生成会话错误。请确认网络是否畅通。', res);
                            }
                        })
                    },
                    fail:function (res2) {
                        ut.debug('wx.getUserInfo',res2);
                    }
                });


            },
        });
    },


    /**
     * 使用wx.getUserInfo()方法登录：https://developers.weixin.qq.com/blogdetail?action=get_post_info&lang=zh_CN&token=2111136807&docid=000aee01f98fc0cbd4b6ce43b56c01
     * @param e
     */
    login4: function (e) {
        let that = this;

        //取得非敏感的userInfo后，保存到共享数据区
        app.globalData.userInfo = e.detail.userInfo;

        //登录取得code->获取openId->检查是否为新用户，如果为新用户则提示
        wx.login({
            success: function (res1) {
                wx.getUserInfo({
                    withCredentials: true,   //获取用户的秘密信息，便于发给后端生成session3rd
                    success: function (res2) {
                        //3)准备参数用来获取openId和生成会话
                        let _code = res1.code;
                        let _encryptedData = res2.encryptedData;
                        let _iv = res2.iv;
                        //3)准备参数用来获取openId和生成会话
                        let reqdata = {'code': _code, 'encryptedData': _encryptedData, 'iv': _iv};
                        ut.debug('reqdata:', reqdata);

                        //调用后端的登录校验服务，获得session，缓存到本地
                        wx.request({
                            url: cf.service.loginUrl2,
                            data: reqdata,
                            success: function (res) {
                                ut.debug('后台处理登录的应答:', res);
                                if (res.data.ret === 'error') {
                                    console.warn('认证失败，请再次发起一次认证');
                                    ut.showToast('亲，使点劲点下按钮！');

                                } else {

                                    //4)将session3rd写入本地缓存
                                    wx.setStorageSync('session3rdKey', res.data.session3rdKey);


                                    //将openId补充到userInfo中，便于引用（作为发往后台的查询参数）//TODO：可优化为向后台只发送session3rdkey，后台由此转换为openId，保护用户隐私
                                    app.globalData.userInfo.openId = res.data.openId;
                                    wx.setStorageSync('userInfo', app.globalData.userInfo); //app.checkUser查询用户时使用。

                                    //将首页的访问入口类型设置为NORMAL，避免在会话有效期内重复刷新。
                                    app.globalData.entryType = 'NORMAL';

                                    //登录成功后显示功能按钮
                                    that.setData({
                                        isLogined: true,
                                        userInfo: app.globalData.userInfo
                                    });

                                    //检查是否是新用户，新用户则创建一条记录，老用户则返回老用户的记录（包括手机、角色等）
                                    wx.request({
                                        url: cf.service.userCheckUrl,
                                        data: {
                                            userInfo: app.globalData.userInfo
                                        },
                                        header: {
                                            'session3rdKey': wx.getStorageSync('session3rdKey'),
                                        },
                                        success: function (res2) {

                                            let ret = JSON.stringify(res2.data);

                                            app.globalData.userInfo = res2.data;


                                            //如果后台返回的数据为空（）或者mobile字段尚未填写，则说明用户未注册，将用户标识为新用户。
                                            if ("0" === ret || res2.data.mobile === '') {
                                                ut.debug('新用户，res.data:', res2.data);
                                                that.setData({
                                                    newUser: true
                                                });
                                                app.globalData.newUser = true;

                                            } else {
                                                ut.debug('老用户，res.data:', res2.data);
                                                that.setData({
                                                    newUser: false
                                                });
                                                app.globalData.newUser = false;
                                            }

                                            //检查用户是否已注册，本条语句是为测试。应在需要保留用户信息的时候调用以下语句，引导用户去注册。
                                            app.isNewUser();
                                        }
                                    });
                                }
                            },
                            fail: function (res) {
                                ut.error('oaerr,生成会话错误。请确认网络是否畅通。', res);
                            }
                        });
                    }
                });
            },
        });
    },



    onShow: function () {

        //若是由于会话超时导致的首页刷新，则执行重新登录操作。
        if (app.globalData.entryType === 'SESSION_TIMEOUT') {
            //app.globalData.userInfo = null;
            this.onLoad();
        }
    },



    goHome: function () {
        wx.switchTab(
            {
                url: '../index/index'
            }
        );
    },

    //设置用户角色为LBOR
    setRoleLbor: function () {
        app.globalData.gReqType = 'aaa';//验证app.globalData作为全局参数交换区的例子
        //app.globalData.role = 'LBOR';
        wx.navigateTo({
            url: '../rqst-list/rqst-list?type=all'
        });

        // wx.switchTab({
        //     url: '../lbor-main/lbor-main'
        // })
    },
    //设置用户角色为CLNT
    setRoleClnt: function () {
        app.globalData.gReqType = 'bbb';
        //app.globalData.role = 'CLNT';
        wx.switchTab({
            url: '../clnt-main/clnt-main'
        })
    },

    goTest: function () {
        wx.navigateTo({
            url: '../cmmt-edit/cmmt-edit?reqId=1234&assesseeOpenId=' + app.globalData.userInfo.openId
        })
    },
    goTest2: function () {
        wx.navigateTo({
            url: '../lbor-edit/lbor-edit'
        })
    },


});
