FROM madtune/opencv-cuda:4.10.0

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1

# 設定 Web 服務端口
EXPOSE 5000

# 工作目錄設定
WORKDIR /app

# 1. 安裝系統依賴 (僅保留基礎顯示庫和 gstreamer)
RUN apt-get update && apt-get install -y --no-install-recommends \
    # 基礎顯示和窗口庫
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    # GStreamer 核心庫與插件
    gstreamer1.0-tools \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-rtsp \
    gstreamer1.0-libav \
    # 確保所有 GStreamer 依賴都正確鏈接 (雖然基礎 Image 可能已經有)
    libgstreamer1.0-dev \
&& rm -rf /var/lib/apt/lists/*

# 2. 複製 requirements.txt (假設它現在只包含 numpy/opencv/flask/gevent)
COPY requirements.txt /app/requirements.txt

# 3. 安裝 Python 依賴 (我們不需要 PyTorch 或 Ultralytics 了！)
RUN --mount=type=cache,target=/root/.cache/pip \
    python3 -m pip install --upgrade pip && \
    python3 -m pip install -r /app/requirements.txt Flask gevent

# 4. 複製極簡應用程式原始碼 (假設檔案名為 web_stream.py)
COPY src/ /app/

ENTRYPOINT ["python3", "web_stream.py"]

# 使用 CMD 傳遞參數，這樣可以在 docker run 時覆寫它
CMD ["--stream", "rtsp://admin:cctv-8888@220.130.204.161:504/unicast/c3/s1/live"]