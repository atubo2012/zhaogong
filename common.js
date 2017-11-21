function sayHello(name) {
  console.log(`Hello ${name} !`)
}
function sayGoodbye(name) {
  console.log(`Goodbye ${name} !`)
}


let showMsg = (text,msgType,time) => wx.showToast({
    title: text,
    icon: msgType,
    duration: time*1000
});

let showModal = (t,c,okDo,okp,cancleDo,cacp) =>wx.showModal({
    title: t,
    content: c,
    success: function(res) {
        if (res.confirm) {
            okDo(okp);
        } else if (res.cancel) {
            cancleDo(cacp);
        }
    }
});
exports.showModal = showModal;


module.exports.sayHello = sayHello;
exports.sayGoodbye = sayGoodbye;
exports.showMsg = showMsg;
