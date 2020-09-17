// pages/share/share.js

const app = getApp()
const server_name = app.globalData.serverName///wx_seafood'
import Notify from '../../dist/notify/notify';
import Dialog from '../../dist/dialog/dialog';
import Toast from '../../dist/toast/toast';
var util = require("../../utils/util.js")
Page({
    
    data: {
        active:'share',
        id:'',
        predStatus:'',
        uploadTime:'',
        result_str:'',
        imgUrl:server_name+'/static/pic/loading.gif'
    },
    onChange: function (e) {
        this.setData({
            active: e.detail
        })
        console.log(e.detail)
        if (e.detail === 'home') {
            wx.navigateBack({
    
            })
        } else if (e.detail === 'mine') {
            wx.navigateTo({
                url: '../mine/mine'
            })
        }
    },
    onLoad: function(e){
        wx.showLoading({
            title: '加载中',
        })
        console.log(e.id===undefined)
        if(e.id!==undefined){
            this.setData({
                id: e.id
            })
            var that = this
            var mywxid = wx.getStorageSync('wxid')
            app.globalData.mywxid = mywxid
            wx.request({
                url: server_name + '/pic',
                data: {
                    wxid: app.globalData.mywxid,
                    pic_id: that.data.id
                },
                method: 'POST',
                header: {
                    'content-type': 'application/x-www-form-urlencoded' // 默认值
                },
                success(res) {
                    console.log(res.data)
                    if (res.data.success === 1) {
                        res.data.data.predicted = JSON.parse(res.data.data.predicted)
                        if (res.data.data.predicted != "0") {
                            var names = []
                            var scores = []
                            for (var key in res.data.data.predicted) {
                                names.push(key)
                                scores.push(res.data.data.predicted[key])
                            }
                            var result_str = '\n    ' + names[0] + ': ' + (scores[0] * 100).toFixed(1) + '%\n ' + names[1] + ': ' + (scores[1] * 100).toFixed(1) + '%\n    ' + names[2] + ': ' + (scores[2] * 100).toFixed(1) + '%\n'
                            that.setData({
                                imgUrl: server_name + '/static/thumbnails/' + app.globalData.mywxid + '/' + res.data.data.filename,
                                result_str: result_str,
                                predStatus: names[0]
                            })
                        }
                        wx.hideLoading()
                        wx.showToast({
                            title: '成功',
                            icon: 'success',
                            duration: 800
                        })
                    }
                }
            })
        }else{
            Notify({ type: 'danger', message: '开发中' });

            setTimeout(function () {
                wx.navigateBack()
            }, 1500)
        }
    }
})
        