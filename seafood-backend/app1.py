# coding: utf-8
from __future__ import division
from flask import Flask,request,render_template,redirect,url_for,jsonify
import flask_sqlalchemy
from flask_sqlalchemy import SQLAlchemy
import pymysql
import datetime
import time,os,copy,requests,json
from PIL import Image
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://*/seafood"
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY']='wtfwtf'
db = SQLAlchemy(app)
WORKING_DIR = os.getcwd()#'/home/wx_seafood'


class User(db.Model): 
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    wxid = db.Column(db.String(65), nullable=True)
    last_ip = db.Column(db.String(100),nullable=False)
    #pic_url = db.Column(db.Text,nullable=True)
    #email = db.Column(db.String(80), nullable=True, unique=True)
    #role_id = db.Column(db.Integer, db.ForeignKey('roles.id'))
    #password_hash = db.Column(db.String(256), nullable=True)
    #confirmed = db.Column(db.Boolean, default=False)
    def __init__(self,last_ip,wxid='0',pic_url=''):
        self.wxid = wxid
        self.last_ip = last_ip 
        #self.pic_url = pic_url

class Pic(db.Model):
    __tablename__='pic'
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200), nullable=False)
    wxid =db.Column(db.String(65), nullable=True)
    upload_time = db.Column(db.String(20),nullable=False)
    predicted = db.Column(db.Text, nullable=True)
    def __init__(self,filename,wxid='0',predicted='0'):
        self.filename = filename
        self.wxid = wxid
        self.upload_time = int(time.time())
        self.predicted = predicted

class Queue(db.Model):
    __tablename__='queue'
    id = db.Column(db.Integer, primary_key=True)
    pic_id = db.Column(db.Integer,nullable=False)
    filename = db.Column(db.String(200), nullable=False)
    wxid =db.Column(db.String(65), nullable=True)
    q_time = db.Column(db.String(20),nullable=False)
    def __init__(self,pic_id,filename,wxid):
        self.pic_id = pic_id 
        self.filename = filename
        self.wxid = wxid
        self.q_time =int(time.time())


def add_to_queue(wxid,filename):
    pic_id = Pic.query.filter(Pic.filename==filename).filter(Pic.wxid==wxid).first().id
    new_elem = Queue(pic_id,filename,wxid)
    try:
        db.session.add(new_elem)
        db.session.commit()
        return Queue.query.filter(Queue.filename==filename).filter(Queue.wxid==wxid).first().id 
    except Exception as e:
        print(e)
        db.session.rollback()
        return '0'          

def remove_from_queue(wxid,filename):
    q = Queue.query.filter(Queue.filename==filename).filter(Queue.wxid==wxid).first()
    try:
        db.session.delete(q)
        db.session.commit()
        return True
    except Exception as e:
        print(e)
        db.session.rollback()
        return False

@app.route('/seafood/code')
def pcode(): 
    msg = {'success':0,'exist':0,'data':'','errorCode':0}
    code = request.values.get('code')
    #print(code)
    if not code:
        msg['data']='no code'
        return jsonify(msg)
    url = 'https://api.weixin.qq.com/sns/jscode2session'+params
    #print(url)
    r = requests.get(url)
    result = json.loads(r.text)
    print(result)
    if result.has_key('openid'):
        wxid = result['openid']
        print(wxid)
        msg['data'] = wxid
        msg['success'] = 1
        return jsonify(msg)
    else:
        msg['errorCode'] = 14
        return jsonify(msg)
@app.route('/seafood/home',methods=['GET','POST'])
def homepage():
    return render_template('upload.html')

@app.route('/seafood/my',methods=['GET','POST'])
def my():
    wxid = request.values.get('wxid')
    msg = {'success':0,'exist':0,'data':{},'errorCode':0,'total':0} 
    if not wxid:
        msg['data'] = 'WXID MISSING'
        msg['errorCode'] = '13'  
        return jsonify(msg)
    a = loguser(wxid) 
    if loguser(wxid):
        if request.values.get('one'):
            info = Pic.query.filter(Pic.wxid==wxid).order_by(Pic.id.desc()).first()
            if info == None:
                msg['success'] = 1
                msg['data'] = '新用户'
                return jsonify(msg)
            info = info.__dict__
            info.pop('_sa_instance_state')
            msg['success'] = 1
            msg['exist'] = 1
            msg['data'] = info#json.dumps(info)
            return jsonify(msg)
        info = Pic.query.filter(Pic.wxid==wxid).all()
        result = []
        for i in info: 
            i = i.__dict__
            i.pop('_sa_instance_state')
            result.append(i)
        if result == []:
            msg['success'] = 1
            msg['data'] = '新用户'
            return jsonify(msg)
        else:
            msg['success'] = 1
            msg['exist'] = 1
            msg['data'] = result
            msg['total'] =len(result)
            return jsonify(msg)
    else:
        msg['data'] = 'Error logging user.' +str(a)
        return jsonify(msg)
 

@app.route('/seafood/pic',methods=['POST'])
def pic():
    msg = {'success':0,'exist':0,'data':'','errorCode':0}
    wxid = request.values.get('wxid')
    print(request.values.get('pic_id'))
    if not wxid:
        msg['data'] = 'WXID MISSING'
        msg['errorCode'] = '1'
        return jsonify(msg)
    if loguser(wxid):
        picid = request.values.get('pic_id')
        if not picid:
            msg['errorCode'] = '2'
            msg['data'] = 'PICID missing.'
            return jsonify(msg)
        pic = Pic.query.filter(Pic.id==picid).first()
        if pic:
            result = {'pic_id':picid,'predicted':pic.predicted,'wxid':pic.wxid,'filename':pic.filename}
            msg['data'] = result 
            msg['success'] = 1
            msg['exist'] = 1
            return jsonify(msg)
        else:
            msg['data'] = '未找到相应图片！'
            return jsonify(msg)
    else:
        msg['data'] = 'Error logging user.'
        msg['errorCode'] = '2'
        return jsonify(msg)

@app.route('/seafood/upload',methods=['POST'])
def upload():
    msg = {'success':0,'exist':0,'data':'','errorCode':0}
    wxid = request.values.get('wxid')
    if not wxid:
        msg['errorCode'] = 1
        msg['data'] = 'WXID MISSING'
        return jsonify(msg)
    if loguser(wxid):
        pic = request.files.get('content')
        picname = str(int(time.time()))+'-'+pic.filename
        if True:
            new_pic = Pic(picname,wxid,predicted=0)
            try:
                path = WORKING_DIR+'/static/uploads/'+wxid+'/'+picname
                pic.save(path)
                img = Image.open(path)
                new_width = 400
                print(img.size)
                new_height = int((img.size[1])/(img.size[0]/400))
                img = img.resize((new_width,new_height),Image.ANTIALIAS)
                if(not os.path.exists(WORKING_DIR+'/static/thumbnails/'+wxid)):
                    os.makedirs(WORKING_DIR+'/static/thumbnails/'+wxid)
                try:
                    img.save(WORKING_DIR+'/static/thumbnails/'+wxid+'/'+picname)
                    try: 
                        db.session.add(new_pic)
                        db.session.commit()
                        a = add_to_queue(wxid,picname)
                        if a != '0':
                            latest_id = Pic.query.filter(Pic.filename==picname).first().id
                            if latest_id==None:
                                msg['data'] = '数据库错误'
                                msg['errorCode'] = '3'
                                return jsonify(msg)
                            rd = {'picname':picname,'id':latest_id}
                            msg['data'] = rd
                            msg['success'] = 1
                            return jsonify(msg)
                        else:
                            db.session.rollback()
                            msg['data'] = '数据库错误'+str(e)
                            msg['errorCode'] = '4'
                            return jsonify(msg)
                    except Exception as e:
                        print(e)
                        db.session.rollback()        
                        msg['data'] = '数据库错误'+str(e)
                        msg['errorCode'] = '5'
                        return jsonify(msg)
                except Exception as e:
                    msg['data'] = '保存错误'+str(e)
                    msg['errorCode'] = '6'
                    return jsonify(msg)
            except Exception as e:
                print(e)
                msg['data'] = '保存错误'+str(e)
                msg['errorCode'] = '7'
                return jsonify(msg)
    else:
        msg['data'] = 'Error logging user.'
        msg['errorCode'] = '2'
        return jsonify(msg)

def loguser(wx_id):
    wxid = wx_id
    user = User.query.filter(User.wxid==wxid).first()
    if not user:
        ip = request.remote_addr
        new_usr = User(ip,wxid=wxid)
        try:
            os.mkdir(WORKING_DIR+'/static/uploads/'+wxid)
            try:
                db.session.add(new_usr)
                db.session.commit()
                print('log user done')
                return True
            except Exception as e:
                print(e)
                db.session.rollback()
                return str(e)   
        except Exception as e:
            print(e)
            return str(e)               
    return True
@app.route('/seafood/dbs')
def dbs():
    pic = Pic.query.all()
    user = User.query.all()
    que = Queue.query.all()
    a = []
    b= []
    c = []
    for u in user:
        u = u.__dict__
        u.pop('_sa_instance_state')
        a.append(u)
    for p in pic:
        p = p.__dict__ 
        p.pop('_sa_instance_state')
        b.append(p)
    for q in que:
        q = q.__dict__
        q.pop('_sa_instance_state')
        c.append(q)
    return str(a)+'<hr>'+str(b)+'<hr>'+str(c)

if __name__ == '__main__': 
    #db.drop_all()
    db.create_all()
    app.run(debug=True,port=6060,host='0.0.0.0')