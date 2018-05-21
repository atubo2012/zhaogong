let app = getApp();
let ut = require('../../utils/utils.js');

Page({
    data: {
        pageInfo: app.getPageInfo('about'),

        //TODO:可以从数据库中获取
        contents:[
            {title:'一、最新动态',content:[
                {title:'新上业务',content:[
                    {title:'临时保洁',content:''},
                    {title:'家电清洗',content:''},
                ]}
            ]},
            {title:'二、发布说明',content:[
                {title:'20180521',content:[
                    {title:'FEAT',content:''},
                    {title:'BFIX',content:''},
                    {title:'UPDT',content:'内容在这里非常非常的多'},
                ]}
            ]},
            {title:'三、关于我们',content:[
                {title:'理念',content:[
                    {title:'成就自己、影响他人',content:'   内容在这里非常非常的多内容在这里非常非常的多内容在这里非常非常的多内容在这里非常非常的多内容在这里非常非常的多内容在这里非常非常的多'},
                ]},
                {title:'愿景',content:[
                    {title:'一切皆有可能',content:'内容在这里非常非常的多内容在这里非常非常的多内容在这里非常非常的多内容在这里非常非常的多内容在这里非常非常的多内容在这里非常非常的多'},
                ]}
            ]}
        ]
    },
    goHome : function () {
        app.goHome();
    },
    onLoad:function(){
    }

});