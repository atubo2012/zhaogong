let app = getApp();
let common = require('../../common.js');
let cf = require('../../config.js');
let ut = require('../../utils/utils.js');

Page({
    data: {
        pageInfo: app.getPageInfo('about'),

    },
    goHome : function (e) {
        ut.debug(e);
        app.goHome();
    }

});