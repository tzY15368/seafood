const app = getApp()
//const server_name = 'https://www.dutbit.com:6060'///wx_seafood'
const server_name = app.globalData.serverName
var util = require("../../utils/util.js")
import Dialog from '../../dist/dialog/dialog';
import Toast from '../../dist/toast/toast';
import Notify from '../../dist/notify/notify';
Page({
    data:{
        server_name: app.globalData.serverName,///wx_seafood',
        loaded:0,
        info:'',
        refreshLoadingStatus:[],
        refreshFinishStatus:[],
        dispToggle:'display',
        notDisplayToggle:'none',
        show:false,
        shareTarget:[],
        active:'mine'
    },
    onChange: function (e) {
        this.setData({
            active: e.detail
        })
        //console.log(e.detail)
        if (e.detail === 'home') {
            wx.navigateTo({
                url: '../index/index?from=mine'
            })
        } else if (e.detail === 'share') {
            wx.navigateTo({
                url: '../share/share'
            })
        }
    },
    onLoad: function (e) {
        wx.showLoading({
            title: '加载中',
        })
        var that = this
        var mywxid = wx.getStorageSync('wxid')
        app.globalData.mywxid = mywxid
        wx.request({
            url: server_name + '/my',
            data: {
                wxid: app.globalData.mywxid
            },
            success(res) {
                wx.hideLoading()
                console.log(res.data)
                if (res.data.success === 1) {
                    if (res.data.exist === 1) {
                        app.globalData.total = res.data.total
                        for (var i = 0; i < res.data.total; i++) {
                            if (res.data.data[i].predicted !== '0') {
                                //
                                //已经识别成功
                                //
                                //
                                res.data.data[i].predicted = JSON.parse(res.data.data[i].predicted)
                                //console.log(res.data.data[i].predicted)
                                res.data.data[i].upload_time = util.js_date_time(parseInt((res.data.data[i].upload_time)) * 1000)
                                var names = []
                                var scores = []
                                for (var key in res.data.data[i].predicted) {
                                    names.push(key)
                                    scores.push(res.data.data[i].predicted[key])
                                }
                                var result_str = '\n    ' + names[0] + ': ' + (scores[0] * 100).toFixed(1) + '%\n ' + names[1] + ': ' + (scores[1] * 100).toFixed(1) + '%\n    ' + names[2] + ': ' + (scores[2] * 100).toFixed(1) + '%\n'
                                res.data.data[i].names = names
                                res.data.data[i].scores = scores
                                res.data.data[i].result_str = result_str
                                res.data.data[i].shareLoading = 'display'
                                res.data.data[i].shareFinish = 'none'
                                //console.log(res.data.data[i])
                                //console.log(result_str)
                            }
                            else {
                                //
                                //没识别，predicted=0
                                //
                                res.data.data[i].upload_time = util.js_date_time(parseInt((res.data.data[i].upload_time)) * 1000)
                                res.data.data[i].names = ['队列中', 1]
                                res.data.data[i].loading = 'display'
                                res.data.data[i].finish = 'none'
                            }
                        }
                        that.setData({
                            loaded: 1,
                            info: res.data.data,//util.strProcessor(res.data)refreshLoadingStatus: refreshLoadingStatus
                        })
                    }
                }
            },
            fail: err => {
                console.log(err)
                Notify({ type: 'danger', message: '错误：服务器离线！', duration: 10000 })
                that.setData({
                    result_str: '\n服务器离线！下拉刷新'
                })
            }
        })
    },
    manualRefresh: function(e){
        var that =  this
        var targetId = e.currentTarget.id
        var index = e.currentTarget.dataset.index
        var loadingStatus = 'info[' +index + '].loading'
        var finishStatus = 'info['+index+'].finish'
        that.setData({
            [loadingStatus]:'none',
            [finishStatus]:'display'
        })
        var refreshLoading = this.data.refreshLoadingStatus
        var refreshFinish = this.data.refreshFinishStatus
        refreshLoading[index] = 'none'
        refreshFinish[index] = 'display'
        this.setData({
            refreshLoadingStatus:refreshLoading,
            refreshFinishStatus:refreshFinish
        })
        wx.request({
            url: server_name + '/pic',
            data: {
                wxid: app.globalData.mywxid,
                pic_id: e.currentTarget.id
            },
            method: 'POST',
            header: {
                'content-type': 'application/x-www-form-urlencoded' // 默认值
            },
            success(res) {
                console.log(res.data)
                if(res.data.success===1){
                    res.data.data.predicted = JSON.parse(res.data.data.predicted)
                    if (res.data.data.predicted != "0") {
                        for(var i in that.data.info){
                            if(that.data.info[i].id==res.data.data.pic_id){
                                var newInfo = that.data.info
                                var names = []
                                var scores = []
                                for (var key in res.data.data.predicted) {
                                    names.push(key)
                                    scores.push(res.data.data.predicted[key])
                                }
                                var result_str = '\n    ' + names[0] + ': ' + (scores[0] * 100).toFixed(1) + '%\n ' + names[1] + ': ' + (scores[1] * 100).toFixed(1) + '%\n    ' + names[2] + ': ' + (scores[2] * 100).toFixed(1) + '%\n'
                                newInfo[i].result_str = result_str
                                that.setData({
                                    info: newInfo,
                                })
                            }
                        }
                    }
                    that.setData({
                        [loadingStatus]: 'display',
                        [finishStatus]:'none'
                    })
                    wx.showToast({
                        title: '成功',
                        icon: 'success',
                        duration: 800
                    })    
                }
            }
        })
    },
    onDelete: function(){
        var that = this
        Dialog.confirm({
            title: '确认删除',
            message: '该步骤不可逆'
        }).then(() => {
            console.log('asldkfj')
            wx.request({
                url: server_name + '/pic',
                data: {
                    wxid: app.globalData.mywxid,
                    pic_id: id
                },
                method: 'DELETE',
                header: {
                    'content-type': 'application/x-www-form-urlencoded' // 默认值
                },
                success(res) {
                    console.log(res.data)
                    if (res.data.success === 1) {
                        that.onPullDownRefresh
                        wx.showToast({
                            title: '删除成功',
                            icon: 'success',
                            duration: 1000
                        })
                    }
                }
                // on cancel
            })
        }).catch(() => {
            
    })
    },
    onShare: function(e){
        var that = this
        var targetId = e.currentTarget.id
        var index = e.currentTarget.dataset.index
        var loadingStatus = 'info[' + index + '].shareLoading'
        var finishStatus = 'info[' + index + '].shareFinish'
        this.setData({
            [loadingStatus]:'none',
            [finishStatus]:'display'
        })
        //console.log(targetId)
        var id = targetId.split('_')[1]
        console.log(id)
        wx.request({
            url: server_name + '/pic',
            data: {
                wxid: app.globalData.mywxid,
                pic_id: id
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
                        app.globalData.targetFileName = res.data.data.filename
                        app.globalData.targetId = res.data.data.pic_id
                        app.globalData.targetWxid = res.data.data.wxid
                        for (var i in that.data.info) {
                            if (that.data.info[i].id == res.data.data.pic_id) {
                                var newInfo = that.data.info
                                var names = []
                                var scores = []
                                for (var key in res.data.data.predicted) {
                                    names.push(key)
                                    scores.push(res.data.data.predicted[key])
                                }  
                                console.log(names[0],scores[0])
                                that.setData({
                                    show: true,
                                    shareTarget: [names[0], scores[0]],
                                    [loadingStatus]:'display',
                                    [finishStatus]:'none'
                                })
                            }
                        }
                    }
                }
            }
        })
        //console.log(typeof(names))
        //console.log(names['0'])
        //console.log(scores[0])
        
    },
    onShareAppMessage: function (e) {
        this.setData({
            show:false
        })
        console.log(app.globalData.targetFileName)
        var url = server_name + '/static/thumbnails/' + app.globalData.targetWxid + '/' + app.globalData.targetFileName
        console.log(url)
        var value = app.globalData.targetId
        var path = '/pages/share/share?id=' + value
        console.log(path)
        return {
            title: '教你识海鲜：\n图中的海鲜最有可能是：'+this.data.shareTarget[0]+'，可能性有'+(this.data.shareTarget[1]*100).toFixed(3)+'%',
            path: '/pages/share/share?id='+value,//
            imageUrl: url
        }
    },
    onPullDownRefresh: function () {
        wx.showLoading({
            title: '加载中',
        })
        var that = this
        wx.request({
            url: server_name + '/my',
            data: {
                wxid: app.globalData.mywxid
            },
            success(res) {
                wx.hideLoading()
                console.log(res.data)
                if (res.data.success === 1) {
                    if (res.data.exist === 1) {
                        for (var i = 0; i < res.data.total; i++) {
                            if (res.data.data[i].predicted != '0') {
                                //
                                //已经识别成功
                                //
                                //
                                res.data.data[i].predicted = JSON.parse(res.data.data[i].predicted)
                                //console.log(res.data.data[i].predicted)
                                res.data.data[i].upload_time = util.js_date_time(parseInt((res.data.data[i].upload_time)) * 1000)
                                var names = []
                                var scores = []
                                for (var key in res.data.data[i].predicted) {
                                    names.push(key)
                                    scores.push(res.data.data[i].predicted[key])
                                }
                                var result_str = '\n    ' + names[0] + ': ' + (scores[0] * 100).toFixed(1) + '%\n ' + names[1] + ': ' + (scores[1] * 100).toFixed(1) + '%\n    ' + names[2] + ': ' + (scores[2] * 100).toFixed(1) + '%\n'
                                res.data.data[i].names = names
                                res.data.data[i].scores = scores
                                res.data.data[i].result_str = result_str

                                res.data.data[i].shareLoading = 'display'
                                res.data.data[i].shareFinish = 'none'
                                //console.log(res.data.data[i])
                                //console.log(result_str)
                            }
                            else {
                                //
                                //没识别，predicted=0
                                //
                                res.data.data[i].upload_time = util.js_date_time(parseInt((res.data.data[i].upload_time)) * 1000)
                                res.data.data[i].names = ['队列中', 1]

                                res.data.data[i].loading = 'display'
                                res.data.data[i].finish = 'none'
                            }
                        }
                        that.setData({
                            loaded: 1,
                            info: res.data.data
                        })
                        console.log('data reset success.')
                        wx.hideLoading()
                        wx.showToast({
                            title: '成功',
                            icon: 'success',
                            duration: 1000
                        })
                    }
                }
            }
        })
    }
})