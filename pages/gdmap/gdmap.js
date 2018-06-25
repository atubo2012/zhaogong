let amapFile = require('../../vendor/amap-wx.js');
let ut = require('../../utils/utils.js');
let app = getApp();

Page({
    data: {
        app: app,

        //用户当前的坐标
        nowLocation: {},

        //屏幕的中心位置，根据起止点的经纬度平均值计算
        mapCenter: {},

        //根据起止点坐标的图标
        markers: [],

        //距离
        distance: '',

        //耗时
        cost: '',

        //路线折线
        polyline: [],

        //公交路线
        transits: [],

        //默认显示地图、隐藏路径描述
        showDetail: false,

        //默认的交通方式
        trafficType: 'driving',

        //默认的详情按钮描述
        buttonDesc: '详情',

        //标签底色
        tabColors:{
            walking:'',
            ridding:'',
            transit:'',
            driving:'active'
        }
    },

    /**
     * 设置tab标签中的值
     * @param tabName
     * @param propValue
     */
    setTabColors:function(tabName,propValue){
        for(let key in this.data.tabColors){
            if(tabName === key){
                this.data.tabColors[key] = propValue;
            }else{
                this.data.tabColors[key] = '';
            }
        }
        this.setData({
            tabColors:this.data.tabColors,
        });
    },

    onLoad: function (option) {

        console.log(option);

        let that = this;
        let myAmapFun = new amapFile.AMapWX({key: '2d15ece70392d0afd89dae800f78f94d'});

        let to = '';
        let from = '';

        wx.getLocation({
            success: function (res) {
                //如果是带参数加载，则将初始参数记录在data对象中
                if (typeof(option) !== 'undefined') {

                    from = res.longitude + ',' + res.latitude;
                    let fromObj = {'latitude': res.latitude, 'longitude': res.longitude};

                    ut.debug('getLocation', from, fromObj);

                    let location = JSON.parse(option.location);
                    to = location.longitude + ',' + location.latitude;
                    let toObj = {'latitude': location.latitude, 'longitude': location.longitude};

                    ut.debug('toObj', toObj);
                    let markerFrom = {
                        iconPath: "../../image/navi_start.png",
                        id: 0,
                        width: 23,
                        height: 33
                    };
                    let markerTo = {
                        iconPath: "../../image/navi_stop.png",
                        id: 0,
                        width: 23,
                        height: 33
                    };


                    let markers = [
                        (Object.assign(markerFrom, fromObj)),
                        (Object.assign(markerTo, toObj))
                    ];

                    ut.debug('markers', markers);
                    let mapCenter = {
                        longitude: (res.longitude + location.longitude) / 2,
                        latitude: (res.latitude + location.latitude) / 2
                    };
                    ut.debug('mapCenter', mapCenter);


                    that.setData({
                        to: to,
                        from: from,
                        mapCenter: mapCenter,
                        markers: markers
                    })

                } else {
                    to = that.data.to;
                    from = that.data.from;
                }

                //非公交类交通工具使用的参数对象
                let params = {
                    origin: from,
                    destination: to,
                    success: function (data) {
                        let points = [];
                        if (data.paths && data.paths[0] && data.paths[0].steps) {
                            let steps = data.paths[0].steps;
                            for (let i = 0; i < steps.length; i++) {
                                let poLen = steps[i].polyline.split(';');
                                for (let j = 0; j < poLen.length; j++) {
                                    points.push({
                                        longitude: parseFloat(poLen[j].split(',')[0]),
                                        latitude: parseFloat(poLen[j].split(',')[1])
                                    })
                                }
                            }
                        }
                        that.setData({
                            polyline: [{
                                points: points,
                                color: "#0091ff",
                                width: 6,
                                arrowLine: true
                            }],

                            steps: data.paths[0].steps
                        });
                        if (data.paths[0] && data.paths[0].distance) {
                            that.setData({
                                distance: data.paths[0].distance + '米'
                            });
                        }
                        if (data.taxi_cost) {
                            that.setData({
                                cost: '打车约' + parseInt(data.taxi_cost) + '元'
                            });
                        }

                    },
                    fail: function (info) {

                    }
                };

                //公交交通使用的参数对象
                let paramsTransit = {
                    origin: from,
                    destination: to,
                    city: '上海',
                    success: function (data) {
                        console.log('1111111111111111111', data);
                        let transits = [];
                        if (data && data.transits) {
                            transits = data.transits;
                            for (let i = 0; i < transits.length; i++) {
                                let segments = transits[i].segments;
                                transits[i].transport = [];
                                for (let j = 0; j < segments.length; j++) {
                                    if (segments[j].bus && segments[j].bus.buslines && segments[j].bus.buslines[0] && segments[j].bus.buslines[0].name) {
                                        let name = segments[j].bus.buslines[0].name;
                                        name = name + '\n\n  ['+segments[j].bus.buslines[0].departure_stop.name+'站上，'+segments[j].bus.buslines[0].arrival_stop.name+'站下]'
                                        if (j !== 0) {
                                            name = '--' + name;
                                        }
                                        transits[i].transport.push(name);
                                    }
                                }
                            }

                            ut.debug('公交路线',transits);
                        }
                        that.setData({
                            transits: transits
                        });

                    },
                    fail: function (info) {
                        console.log('000000000000000000000000', info);
                    }
                };

                if (that.data.trafficType === 'driving') {
                    myAmapFun.getDrivingRoute(params);
                } else if (that.data.trafficType === 'ridding') {
                    myAmapFun.getRidingRoute(params)
                } else if (that.data.trafficType === 'walking') {
                    myAmapFun.getWalkingRoute(params)
                } else if (that.data.trafficType === 'transit') {
                    console.log('00000000000');
                    myAmapFun.getTransitRoute(paramsTransit)
                }
            }
        });


    },
    goDetail: function () {
        console.log(this.data.showDetail);
        this.setData({
            showDetail: !this.data.showDetail
        });

        if (this.data.buttonDesc === '详情') {
            this.setData({
                buttonDesc: '地图'
            });
        } else {
            this.setData({
                buttonDesc: '详情'
            });
        }
    },
    goToCar: function (e) {
        this.setData({
            trafficType: 'driving'
        });
        this.setTabColors('driving','active');
        this.onLoad();
    },
    goToBus: function (e) {
        this.setData({
            trafficType: 'transit'
        });
        this.setTabColors('transit','active');
        this.onLoad();
    },
    goToRide: function (e) {
        this.setData({
            trafficType: 'ridding'
        });
        this.setTabColors('ridding','active');
        this.onLoad();
    },
    goToWalk: function (e) {
        this.setData({
            trafficType: 'walking'
        });
        this.setTabColors('walking','active');
        this.onLoad();
    },
    goBack:function (e) {
        wx.navigateBack({
            delta:1
        });
    }
});