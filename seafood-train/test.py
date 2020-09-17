import glob,time
import os.path
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image

 
 
def predict():
    strings = ['象拔蚌','桃花虾','扇贝','青虾','皮皮虾','面包蟹','牡蛎','芒果贝','赤贝','蛏子','鲍鱼','海参','海胆','帝王蟹','红虾','澳洲龙虾','大海虾','蝼蛄虾','鲫鱼','cuttlefish','竹节虾','贻贝','小龙虾']
 
    def id_to_string(node_id):
        return strings[node_id]
    #从pb文件中调用
    with tf.gfile.FastGFile('ckpt/nn.pb', 'rb') as f:#读取图片
        graph_def = tf.GraphDef()#原来是tf.GraphDef(),按照警示更改了
        graph_def.ParseFromString(f.read())
        tf.import_graph_def(graph_def, name='')#导入计算图
 
    with tf.Session() as sess:#原来是tf.Session(),按照警示更改了
        softmax_tensor = sess.graph.get_tensor_by_name('output/prob:0')
        #遍历目录
        for root, dirs, files in os.walk('test'):
            for file in files:
                #载入图片
                image_data = tf.gfile.FastGFile(os.path.join(root, file), 'rb').read()
                predictions = sess.run(softmax_tensor, {'DecodeJpeg/contents:0': image_data})  #
                predictions = np.squeeze(predictions)  #删除predictions数组中的单维度条目，把结果转为1维数据
 
                #
                image_path = os.path.join(root, file)
                print(image_path)
                im = Image.open(image_path)
                #im.show()
 
                #按预测值降序排列
                top_k = predictions.argsort()[::-1]
                #输出排列结果
                print(top_k)
                for node_id in top_k:
                    #获取分类名称
                    human_string = id_to_string(node_id)
                    #获取该分类的置信度
                    score = predictions[node_id]
                    print('%s (score = %.5f)' % (human_string, score))
                print()
                img = cv2.imread(image_path)
                #cv2.imshow('image', img)
                #cv2.waitKey(0)
    cv2.destroyAllWindows()
if __name__ == "__main__":
    start = time.time() 
    predict()
    end = time.time()
    print('time taken:'+str(start-end))


