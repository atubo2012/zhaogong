let ut = require('../utils/utils.js');
let app = getApp();
let cf = app.globalData.cf;

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        title: String,

        //地址
        address: {
            type: String,
            value: ''
        },
        //经纬度
        location:{
            type:Object
        },
        //地名
        name:{
            type:String,
            value:''
        },
        //按钮文字
        buttonDesc: {
            type: String,
            value: '地图'
        },
    },


    data: {

    },


    methods: {

        //用户选中地址坐标时设置location
        _chooseAddress: function () {
            let _that = this;
            if('保存'===this.data.buttonDesc){
                this.triggerEvent("chooseaddressevent", _that.data);
                this.setData({
                    buttonDesc:'地图'
                })
            }else{
            wx.chooseLocation({
                success:function (res) {
                    console.log(res);
                    _that.setData({
                        'address':res.address,
                        'name'  :res.name,
                        'location':{'latitude':res.latitude,'longitude':res.longitude},
                        'buttonDesc':'保存'
                    });
                    _that.triggerEvent("chooseaddressevent", _that.data);
                },
                fail:function (res) {
                    console.error(res);
                }
            })}
        },
        //手动修改地址内容时，设置data中的address
        _setAddress: function (e) {
            this.setData({
                address: e.detail.value
            });
            console.log('setAddress:',e)
            //向主调组件发出事件，通知其更新address
            this.triggerEvent("chooseaddressevent", this.data);
        },
    }
});
