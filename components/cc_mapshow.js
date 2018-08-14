'use strict';
let ut = require('../utils/utils.js');
let amapFile = require('../vendor/amap-wx.js');
const app = getApp();
let cf = app.globalData.cf;

Component({

    properties: {
    },

    data: {
        tabInfo: [ //地图上方的页签控件
            {mode: 'walking', desc: '步行', method: 'byWalk', isActive: true},
            {mode: 'ridding', desc: '骑车', method: 'byRide', isActive: false},
            {mode: 'transit', desc: '公交', method: 'byBus', isActive: false},
            {mode: 'driving', desc: '驾车', method: 'byCar', isActive: false},
        ],
        trafficType: 'walking',  //页面加载时默认选中的交通方式
    },

    /**
     * 组件的方法列表
     */
    methods: {

        byCar: function (e) {
            this.setData({
                trafficType: 'driving'
            });
            this.activeTab('driving');
            this.initCc(this.data.locationFrom,this.data.locationTo);
        },
        byBus: function (e) {
            this.setData({
                trafficType: 'transit'
            });
            this.activeTab('transit');
            this.initCc(this.data.locationFrom,this.data.locationTo);
        },
        byRide: function (e) {
            this.setData({
                trafficType: 'ridding'
            });
            this.activeTab('ridding');
            this.initCc(this.data.locationFrom,this.data.locationTo);
        },
        byWalk: function (e) {
            this.setData({
                trafficType: 'walking'
            });
            this.activeTab('walking');
            this.initCc(this.data.locationFrom,this.data.locationTo);
        },
        activeTab: function (tabName) {
            //遍历页签过程中，使指定的页签生效、其他页签失效
            for (let i = 0; i < this.data.tabInfo.length; i++) {
                if (tabName === this.data.tabInfo[i].mode) {
                    this.data.tabInfo[i].isActive = true;
                } else {
                    this.data.tabInfo[i].isActive = false;
                }
            }
            //渲染页面
            this.setData({
                tabInfo: this.data.tabInfo,
            });
        },

        initCc: function (locationFrom,locationTo) {
            let that = this;
            this.setData({
                locationFrom:locationFrom,
                locationTo:locationTo,
                slocation:JSON.stringify(locationTo)
            });
            console.log('this is mapshow ');

            /**
             * 展示地图
             */
            let myAmapFun = new amapFile.AMapWX({key: '2d15ece70392d0afd89dae800f78f94d'});
            let to = '';
            let from = '';


            //1-1准备起止点的坐标参数
            from = locationFrom.longitude + ',' + locationFrom.latitude;
            let fromObj = {'latitude': locationFrom.latitude, 'longitude': locationFrom.longitude};

            to = locationTo.longitude + ',' + locationTo.latitude;
            let toObj = {'latitude': locationTo.latitude, 'longitude': locationTo.longitude};
            //ut.debug('getLocation', from, fromObj, 'toObj', toObj);

            //1-2准备起止点的标记风格参数
            let markerFrom = {
                iconPath: "../image/navi_start.png",
                id: 0,
                width: 23,
                height: 33
            };
            let markerTo = {
                iconPath: "../image/navi_stop.png",
                id: 0,
                width: 23,
                height: 33
            };
            let markers = [
                (Object.assign(markerFrom, fromObj)),
                (Object.assign(markerTo, toObj))
            ];
            //ut.debug('markers', markers);

            //1-3根据起止点的坐标，得出将显示的地图中央坐标
            let mapCenter = {
                longitude: (locationFrom.longitude + locationTo.longitude) / 2,
                latitude: (locationFrom.latitude + locationTo.latitude) / 2
            };
            ut.debug('mapCenter', mapCenter);

            //1-4将上述参数保存在data对象中便于生成地图使用
            that.setData({
                to: to,
                from: from,
                mapCenter: mapCenter,
                markers: markers
            });


            //2准备路径规划参数
            //2-1非公交类交通工具使用的参数对象
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
                    if (data.paths[0] && data.paths[0].duration) {
                        that.setData({
                            durationGd: '(' + parseInt(data.paths[0].duration / 60) + '分钟' + ')'
                        });
                    }
                    if (data.taxi_cost) {
                        that.setData({
                            cost: '打车约' + parseInt(data.taxi_cost) + '元'
                        });
                    }
                },
                fail: function (info) {
                    ut.error('OAERROR:非公交类路径规划服务调用失败', info)
                }
            };

            //2-2公交交通使用的参数对象
            let paramsTransit = {
                origin: from,
                destination: to,
                city: '上海',
                success: function (data) {
                    //console.log('1111111111111111111', data);
                    let transits = [];
                    if (data && data.transits) {
                        transits = data.transits;
                        for (let i = 0; i < transits.length; i++) {
                            let segments = transits[i].segments;
                            transits[i].transport = [];
                            for (let j = 0; j < segments.length; j++) {
                                if (segments[j].bus && segments[j].bus.buslines && segments[j].bus.buslines[0] && segments[j].bus.buslines[0].name) {
                                    let name = segments[j].bus.buslines[0].name;
                                    name = name + '\n\n  [' + segments[j].bus.buslines[0].departure_stop.name + '站上，' + segments[j].bus.buslines[0].arrival_stop.name + '站下]'
                                    if (j !== 0) {
                                        name = '--' + name;
                                    }
                                    transits[i].transport.push(name);
                                }
                            }
                        }
                        //ut.debug('公交路线', transits);
                    }
                    that.setData({
                        transits: transits
                    });

                },
                fail: function (info) {
                    console.log('000000000000000000000000', info);
                }
            };

            //3根据不同的交通方式调用对应的api生成地图
            if (that.data.trafficType === 'driving') {
                myAmapFun.getDrivingRoute(params);
            } else if (that.data.trafficType === 'ridding') {
                myAmapFun.getRidingRoute(params);
            } else if (that.data.trafficType === 'walking') {
                myAmapFun.getWalkingRoute(params);
            } else if (that.data.trafficType === 'transit') {
                myAmapFun.getTransitRoute(paramsTransit)
            }

        },


    }
})
