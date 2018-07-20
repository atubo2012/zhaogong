let ut = require('../utils/utils.js');
let app = getApp();
let cf = app.globalData.cf;

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        //姓名
        name:{
            type:String,
            value:''
        },
        sex:{
            type:String,
            value:''
        },

    },


    data: {
        sexItems: [
            {name: '先生', value: '先生', checked: true},
            {name: '女士', value: '女士'},
        ],
    },


    methods: {


        //手动修改地址内容时，设置data中的address
        _setName: function (e) {
            this.setData({
                name: e.detail.value
            });
            console.log('_setName:',e);
            //向主调组件发出事件，通知其更新address
            this.triggerEvent("inputnametitleevent", this.data);
        },

        _setSexItem: function (e) {
            this.setData({
                sex: e.detail.value
            });
            console.log('_setName:',e);
            ut.getRa(e.detail.value, this.data.sexItems);

            //向主调组件发出事件，通知其更新address
            this.triggerEvent("inputnametitleevent", this.data);
        },

        renderSexItem:function(sex){
            ut.getRa(sex,this.data.sexItems);
        }

    }
});
