import flask_sqlalchemy,time,copy,requests,json
from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from test2 import predict as p
import os
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:Bit_root_123@www.dutbit.com:3306/seafood"
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY']='wtfwtf'
db = SQLAlchemy(app)
#BASEURL = 'https://www.dutbit.com:6060/wx_seafood/static/uploads/'
BASEURL = 'https://www.dutbit.com/seafood/static/uploads/'
#BASEURL = 'https://ftmagic.xyz:6060/static/uploads/'
class Pic(db.Model):
    __tablename__='pic'
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200), nullable=False)
    wxid =db.Column(db.String(65), nullable=True)
    upload_time = db.Column(db.String(20),nullable=False)
    predicted = db.Column(db.Text, nullable=True)
    def __init__(self,filename,wxid='0',upload_time=int(time.time()),predicted='0'):
        self.filename = filename
        self.wxid = wxid
        self.upload_time = upload_time
        self.predicted = predicted

class Queue(db.Model):
    __tablename__='queue'
    id = db.Column(db.Integer, primary_key=True)
    pic_id = db.Column(db.Integer,nullable=False)
    filename = db.Column(db.String(200), nullable=False)
    wxid =db.Column(db.String(65), nullable=True)
    q_time = db.Column(db.String(20),nullable=False)
    def __init__(self,pic_id,filename,wxid,q_time=int(time.time())):
        self.pic_id = pic_id
        self.filename = filename
        self.wxid = wxid
        self.q_time =q_time

def do_predict(text):
    r = requests.get(BASEURL+text['wxid']+'/'+text['filename'])
    img = r.content
    with open('test/temp.jpg','wb') as f:
        f.write(img)
    predict_result =json.dumps(p())
    for i in predict_result:
        if i == '\'':
            i = "\""
    Pic.query.filter(Pic.id==text['pic_id']).update({'predicted':predict_result})  
    try:
        db.session.commit()
    except Exception as e:
        print(e)
        db.session.rollback()

def main():
    q = Queue.query.first()
    if q==None:
        print('empty q')
        return 0
    a = copy.deepcopy(q)
    a = a.__dict__
    a.pop('_sa_instance_state')
    try:
        db.session.delete(q)
        print(a)
        do_predict(a)
        os.remove('test/temp.jpg')
        print('remove oks')
        return 1
    except Exception as e:
        db.session.rollback()
        print(e)
        return -1

if __name__ == "__main__":
    db.create_all()
    while True:
        main()
        time.sleep(3)
    
    '''
    q = Queue.query.first()
    if q==None:
        print('empty q')
    a = copy.deepcopy(q)
    a = a.__dict__
    a.pop('_sa_instance_state')
    print(a)
    '''