//app.js
App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    try {
        var value = wx.getStorageSync('wxid')
        if (value) {
            console.log('get wxid success:'+value)
        } else {
            this.doLogin()
        }
        } catch (e) {
            console.log(e)
        }
  },
    doLogin: function(){
        console.log('start login')
        this.doWxLogin()
        .then(code => {
            return this.doGetCode(code)
        })
        .then(wxid => {
            return this.saveWxid(wxid)
        })
    },
    doWxLogin: function(){
        var p = new Promise(function(resolve,reject){
            wx.login({
                success: res=>{
                    resolve(res.code)
                    reject(res.errMsg)
                }
            })
        })
        return p
    },
    doGetCode: function(code){
        console.log(code)
        var that = this
        var p = new Promise(function(resolve,reject){
            wx.request({
                url: that.globalData.serverName + '/code',
                data: {
                    code: code
                },
                success: res =>{
                    console.log(res.data)
                    var wxid = res.data.data
                    console.log(wxid + '-------------')
                    wx.setStorageSync('wxid', wxid)
                    console.log('finish login')
                    that.globalData.mywxid = wxid
                    if(that.loginCallback){
                        that.loginCallback(wxid)
                    }
                    resolve(res.data)
                    reject(res.data)
                }
            })
            
        })
        return p
    },
    saveWxid: function(wxid){
        
        //console.log(this.globalData)
        return 1
    },
    globalData: {
        userInfo: null,
        serverName: 'https://www.dutbit.com/seafood',//:6060',
        mywxid:'',
        flag:0//登陆则设为1 
    },
})