# 核心功能：RTSP 串流捕獲並轉發為 MJPEG 網頁視訊
import time
import sys
import cv2
import queue
import threading
from argparse import ArgumentParser, ArgumentDefaultsHelpFormatter
from flask import Flask, Response

# 初始化 Flask 應用
app = Flask(__name__)

# --- 參數解析與初始化 ---
parser = ArgumentParser(formatter_class=ArgumentDefaultsHelpFormatter)
parser.add_argument("--stream", type=str, required=True, help="RTSP address of video stream.")
args = vars(parser.parse_args())

rtsp_stream = args["stream"]
q = queue.Queue(maxsize=5) # 緩衝區隊列
loop = True

# --- 執行緒：持續接收影像幀 ---
def receive_frames():
    global cap
    print(f"Connecting to RTSP stream: {rtsp_stream}")
    cap = cv2.VideoCapture(rtsp_stream)

    if not cap.isOpened():
        print("FATAL ERROR: Failed to open RTSP stream. Check URL and connectivity.")
        sys.exit(1)

    # 獲取 FPS 以設定讀取間隔
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        print("Warning: FPS is 0. Assuming 30 FPS for processing.")
        fps = 30
        
    period = 1 / fps
    print(f"RTSP Stream connected. FPS: {fps:.2f}")

    while loop:
        ret, frame = cap.read()
        if ret:
            # 只保留最新的幀
            if q.full():
                q.get() 
            q.put(frame)
        else:
            # 斷線重連邏輯 (簡化)
            print(f"Camera disconnected. Attempting to reconnect...")
            while loop:
                cap = cv2.VideoCapture(rtsp_stream)
                if cap.isOpened():
                    print(f"Camera successfully reconnected.")
                    break
                else: 
                    time.sleep(5)
        
        time.sleep(period / 2)

# --- MJPEG Generator 核心功能 ---
def generate_frames():
    while loop:
        if q.empty():
            time.sleep(0.01) # 短暫等待
            continue
            
        frame = q.get()
        
        # 將 OpenCV 影像幀編碼為 JPEG 格式 (無任何處理)
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        
        # 輸出 MJPEG 格式數據 (Web Stream)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# --- Flask 路由 ---
@app.route('/video_feed')
def video_feed():
    # Content-Type: multipart/x-mixed-replace 是 MJPEG 串流的標準
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    return "Simple RTSP Streamer is running. Access the video feed at /video_feed"

# --- 啟動程序 ---
if __name__ == '__main__':
    # 啟動接收幀的執行緒
    receive_thread = threading.Thread(target=receive_frames)
    receive_thread.daemon = True 
    receive_thread.start()

    print("Starting Flask server on http://0.0.0.0:5000")
    # 使用 gevent Web 服務器來處理 MJPEG 串流
    from gevent.pywsgi import WSGIServer
    try:
        http_server = WSGIServer(('0.0.0.0', 5000), app)
        http_server.serve_forever()
    except KeyboardInterrupt:
        print("Server shutting down...")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        loop = False
        receive_thread.join()
        cv2.destroyAllWindows()
        print("Exiting application.")