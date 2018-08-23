// components/cc_rqst_item.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        item: {
            type: Object
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        _bizType2url:{
            'hscleaning':'-',
            'program':'-comd-'
        },
    },


    attached: function () {
        //console.log('this is it', this.data.item)
    },
    moved: function(){},
    detached: function(){},
    /**
     * 组件的方法列表
     */
    methods: {}
})
