const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}
//时间戳转换成日期时间
function js_date_time(unixtime) {
  var date = new Date(unixtime);
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  m = m < 10 ? ('0' + m) : m;
  var d = date.getDate();
  d = d < 10 ? ('0' + d) : d;
  var h = date.getHours();
  h = h < 10 ? ('0' + h) : h;
  var minute = date.getMinutes();
  var second = date.getSeconds();
  minute = minute < 10 ? ('0' + minute) : minute;
  second = second < 10 ? ('0' + second) : second;
  // return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second;//年月日时分秒
  return y + '-' + m + '-' + d + ' ' + h + ':' + minute;

}

function strProcessor(resText){
  for(var i=0;i<resText.total;i++){
  if (resText.data[i].predicted !== '0') {
      //
      //已经识别成功
      //
      //
      resText.data[i].predicted = JSON.parse(resText.data[i].predicted)
      //console.log(res.data.data[i].predicted)
      resText.data[i].upload_time = util.js_date_time(parseInt((resText.data[i].upload_time)) * 1000)
      var names = []
      var scores = []
      for (var key in resText.data[i].predicted) {
          names.push(key)
          scores.push(resText.data[i].predicted[key])
      }
      var result_str = '\n    ' + names[0] + ': ' + (scores[0] * 100).toFixed(1) + '%\n ' + names[1] + ': ' + (scores[1] * 100).toFixed(1) + '%\n                 ' + names[2] + ': ' + (scores[2] * 100).toFixed(1) + '%\n'
      resText.data[i].names = names
      resText.data[i].scores = scores
      resText.data[i].result_str = result_str
      //console.log(res.data.data[i])
      //console.log(result_str)
  }
  else {
      //
      //没识别，predicted=0
      //
      resText.data[i].upload_time = util.js_date_time(parseInt((resText.data[i].upload_time)) * 1000)
      resText.data[i].names = ['队列中', 1]
  }
}
  return resText
}
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

module.exports = {
  formatTime: formatTime,
  js_date_time: js_date_time,
  strProcessor: strProcessor
}
