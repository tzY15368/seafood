//index.js
//获取应用实例
const app = getApp()
const server_name = app.globalData.serverName///wx_seafood'

var util = require("../../utils/util.js")
import Notify from '../../dist/notify/notify';
import Dialog from '../../dist/dialog/dialog';
Page({
    data: {
        active: 'home',
        info: {},
        shareLoading: 'none',
        shareFinish: 'none',
        loading: 'none',
        finish: 'none',
        uploadDisp: 'none',
        imgUrl: '',
        result_str: '',
        shareTarget: [],
        show: false,
        uploadTime: '',
        predStatus: '',
        panelTitle: '请等待'
    },

    onChange: function (e) {
        this.setData({
            active: e.detail
        })
        //console.log(e.detail)
        if (e.detail === 'mine') {
            wx.navigateTo({
                url: '../mine/mine'
            })
        }else if(e.detail === 'share'){
            wx.navigateTo({
                url:'../share/share'
            })
        }
    },
    onShare: function (e) {
        var that = this
        var value = wx.getStorageSync('frontPicId')
        if (value) {
            this.setData({
                shareLoading: 'none',
                shareFinish: 'display'
            })
            wx.request({
                url: server_name + '/pic',
                data: {
                    wxid: app.globalData.mywxid,
                    pic_id: value
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
                                    console.log(names[0], scores[0])
                                    that.setData({
                                        show: true,
                                        shareTarget: [names[0], scores[0]],
                                        shareLoading: 'display',
                                        shareFinish: 'none'
                                    })
                                }
                            }
                        }
                    }
                }
            })
        }
    },
    onShareAppMessage: function (e) {
        var value = wx.getStorageSync('frontPicId')
        this.setData({
            show: false
        })
        //console.log(app.globalData.targetFileName)
        var url = server_name + '/static/thumbnails/' + app.globalData.targetWxid + '/' + app.globalData.targetFileName
        var path='/pages/share/share?id='+value//
        console.log('path:'+path)
        //console.log(url)
        return {
            title: '教你识海鲜：图中的海鲜最有可能是：' + this.data.shareTarget[0] + '，可能性有' + (this.data.shareTarget[1] * 100).toFixed(3) + '%',
            path: '/pages/share/share?id='+value,//
            imageUrl: url
        }
    },
    onPullDownRefresh :function(e){
        this.onLoad()
    },
    onLoad: function (e) {
        //console.log(e)
        //console.log(e === undefined)
        //console.log(e.from === undefined)
        //console.log(e.flag === false)
        if (e === undefined || e.from === undefined ||e.flag ===false) {
            Notify({
                message: '登陆成功',
                duration: 1000,
                type: 'primary'
            });
        app.globalData.flag = 1
        }
        var that = this
        var mywxid = wx.getStorageSync('wxid')
        if (mywxid===''){
            console.log('waiting for async callback')
            app.loginCallback = wxid =>{
                console.log(wxid+'====after call back')
                if(wxid != ''){
                  that.setData({
                    uploadDisp: 'display'
                  })
                    console.log('+++++'+wxid)
                    app.globalData.mywxid = wxid
                    wx.request({
                        url: server_name + '/my?one=1',
                        data: {
                            wxid: app.globalData.mywxid
                        },
                        success(res3) {
                            console.log(res3.data)
                            if (res3.data.success === 1) {
                                if (res3.data.exist !== 0) {
                                    if (res3.data.data.predicted === "0") {
                                        var ut = util.js_date_time(parseInt((res3.data.data.upload_time)) * 1000)
                                        wx.setStorage({
                                            key: "frontPicId",
                                            data: res3.data.data.id
                                        })
                                        that.setData({
                                            imgUrl: server_name + '/static/thumbnails/' + app.globalData.mywxid + '/' + res3.data.data.filename,
                                            result_str: '\n队列中，请等待\n ',
                                            info: res3.data,
                                            loading: 'display',
                                            predStatus: '队列中',
                                            uploadTime: ut,
                                            panelTitle: '最近图片上传'
                                        })

                                    }
                                    else {
                                        res3.data.data.predicted = JSON.parse(res3.data.data.predicted)
                                        //console.log(res.data.data[i].predicted)
                                        //res3.data.data.upload_time = util.js_date_time(parseInt((res3.data.data.upload_time))* 1000)
                                        var names = []
                                        var scores = []
                                        for (var key in res3.data.data.predicted) {
                                            names.push(key)
                                            scores.push(res3.data.data.predicted[key])
                                        }
                                        res3.data.names = names
                                        res3.data.scores = scores
                                        var result_str = '\n    ' + names[0] + ': ' + (scores[0] * 100).toFixed(1) + '%\n ' + names[1] + ': ' + (scores[1] * 100).toFixed(1) + '%\n    ' + names[2] + ': ' + (scores[2] * 100).toFixed(1) + '%\n'
                                        app.globalData.frontPicId = res3.data.data.id
                                        wx.setStorage({
                                            key: "frontPicId",
                                            data: res3.data.data.id
                                        })
                                        var ut = util.js_date_time(parseInt((res3.data.data.upload_time)) * 1000)
                                        that.setData({
                                            imgUrl: server_name + '/static/thumbnails/' + app.globalData.mywxid + '/' + res3.data.data.filename,
                                            result_str: result_str,
                                            info: res3.data,
                                            shareLoading: 'display',
                                            uploadTime: ut,
                                            panelTitle: '最近图片上传',
                                            predStatus: names[0],
                                        })
                                    }
                                }
                                else {
                                    that.setData({
                                        imgUrl: server_name + '/static/pic/q.jpg',
                                        result_str: '\n新用户你好！'
                                    })
                                }
                            }
                            else {
                                Notify({ type: 'danger', message: '服务端查询出错' });
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
                }
                 
            }
        }
        else {
        that.setData({
            uploadDisp: 'display'
        })
        console.log('async process done or wxid cached.')
        app.globalData.mywxid = mywxid
        wx.request({
            url: server_name + '/my?one=1',
            data: {
                wxid: mywxid
            },
            success(res3) {
                console.log(res3.data)
                if (res3.data.success === 1) {
                    if (res3.data.exist !== 0) {
                        if (res3.data.data.predicted === "0") {
                            var ut = util.js_date_time(parseInt((res3.data.data.upload_time)) * 1000)
                            wx.setStorage({
                                key: "frontPicId",
                                data: res3.data.data.id
                            })
                            that.setData({
                                imgUrl: server_name + '/static/thumbnails/' + app.globalData.mywxid + '/' + res3.data.data.filename,
                                result_str: '\n队列中，请等待\n ',
                                info: res3.data,
                                loading: 'display',
                                predStatus: '队列中',
                                uploadTime: ut,
                                panelTitle: '最近图片上传'
                            })

                        }
                        else {
                            res3.data.data.predicted = JSON.parse(res3.data.data.predicted)
                            //console.log(res.data.data[i].predicted)
                            //res3.data.data.upload_time = util.js_date_time(parseInt((res3.data.data.upload_time)) * 1000)
                            var names = []
                            var scores = []
                            for (var key in res3.data.data.predicted) {
                                names.push(key)
                                scores.push(res3.data.data.predicted[key])
                            }
                            res3.data.names = names
                            res3.data.scores = scores
                            var result_str = '\n    ' + names[0] + ': ' + (scores[0] * 100).toFixed(1) + '%\n ' + names[1] + ': ' + (scores[1] * 100).toFixed(1) + '%\n    ' + names[2] + ': ' + (scores[2] * 100).toFixed(1) + '%\n'
                            app.globalData.frontPicId = res3.data.data.id
                            wx.setStorage({
                                key: "frontPicId",
                                data: res3.data.data.id
                            })
                            var ut = util.js_date_time(parseInt((res3.data.data.upload_time)) * 1000)
                            that.setData({
                                imgUrl: server_name + '/static/thumbnails/' + app.globalData.mywxid + '/' + res3.data.data.filename,
                                result_str: result_str,
                                info: res3.data,
                                shareLoading: 'display',
                                uploadTime: ut,
                                panelTitle: '最近图片上传',
                                predStatus: names[0],
                            })
                        }
                    }
                    else {
                        that.setData({
                            imgUrl: server_name + '/static/pic/q.jpg',
                            result_str: '\n新用户你好！'
                        })
                    }
                }
                else {
                    Notify({ type: 'danger', message: '服务端查询出错' });
                }
            },
            fail: err=>{
                console.log(err)
                Notify({type: 'danger', message: '错误：服务器离线！', duration: 10000})
                that.setData({
                    result_str:'\n服务器离线！下拉刷新'
                })
            }
        }) 
        }    
    },
    manualRefresh: function(e){
        var that = this
        this.setData({
            loading:'none',
            finish:'display'
        })
        try {
            var value = wx.getStorageSync('frontPicId')
            if (value) {
                wx.request({
                    url: server_name + '/pic',
                    data: {
                        wxid: app.globalData.mywxid,
                        pic_id: value
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
                                    info:res.data,
                                    result_str:result_str,
                                    predStatus:names[0],
                                    loading:'none',
                                    shareLoading:'display',
                                    shareFinish:'none'
                                })
                                that.onLoad({flag:true,from:'refresh'})
                            }
                            else {
                                that.setData({
                                    loading:'display'
                                })
                            }
                            that.setData({
                                finish: 'none'
                            })
                            wx.showToast({
                                title: '成功',
                                icon: 'success',
                                duration: 800
                            })
                        }
                    }
                })
            }
        } catch (e) {
            // Do something when catch error
            console.log(e)
            
        }
    },
    upload: function (e) {
        var that = this
        wx.chooseImage({
            success(res3) {
                const tempFilePaths = res3.tempFilePaths
                that.setData({
                    latest_src: server_name + '/static/pic/loading.gif',
                    disabled: 'disabled',
                    loading: 'loading'
                })
                const uploadTask = wx.uploadFile({
                    url: server_name + '/upload',
                    filePath: tempFilePaths[0],
                    name: 'content',
                    formData: {
                        'wxid': app.globalData.mywxid,
                    },
                    success(res4) {

                        res4.data = JSON.parse(res4.data)
                        console.log(res4.data)
                        if (res4.data.success === 1) {
                            that.setData({
                                result_str: ''
                            })
                            wx.showToast({
                                title: '成功',
                                icon: 'success',
                                duration: 1000
                            })
                            app.globalData.flag = 1
                            that.onLoad({flag:true,from:'upload'})
                        }
                        else {
                            wx.showToast({
                                title: '上传失败！',
                                icon: 'fail',
                                duration: 1000
                            })
                        }
                        that.setData({})
                    },
                    fail(res) {
                        wx.showToast({
                            title: '失败2',
                            icon: 'fail',
                            duration: 1000
                        })
                    }
                })

                uploadTask.onProgressUpdate((res) => {
                    if (res.progress >= 0 && res.progress <= 20) {
                        wx.showToast({
                            title: String(res.progress),
                            icon: 'loading',
                            duration: 500
                        })
                    }
                    if (res.progress > 20 && res.progress <= 40) {
                        wx.showToast({
                            title: String(res.progress),
                            icon: 'loading',
                            duration: 500
                        })
                    }
                    if (res.progress > 40 && res.progress <= 60) {
                        wx.showToast({
                            title: String(res.progress),
                            icon: 'loading',
                            duration: 500
                        })
                    }
                    if (res.progress > 60 && res.progress <= 80) {
                        wx.showToast({
                            title: String(res.progress),
                            icon: 'loading',
                            duration: 500
                        })
                    }
                    if (res.progress > 80 && res.progress <= 100) {
                        wx.showToast({
                            title: String(res.progress),
                            icon: 'loading',
                            duration: 500
                        })
                    }
                    /*
                    console.log('上传进度', res.progress)
                    console.log('已经上传的数据长度', res.totalBytesSent)
                    console.log('预期需要上传的数据总长度', res.totalBytesExpectedToSend)
                    */
                })
            }
        })

    },
})
