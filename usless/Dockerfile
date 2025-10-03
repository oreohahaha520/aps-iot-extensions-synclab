# FROM nvidia/cuda:12.8.1-cudnn-runtime-ubuntu22.04
FROM madtune/opencv-cuda:4.10.0

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1\
    VENV_PATH=/opt/venv

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    ffmpeg gstreamer1.0-tools gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good gstreamer1.0-plugins-bad \
 && rm -rf /var/lib/apt/lists/*

# RUN python3.12 -m venv $VENV_PATH
# ENV PATH="$VENV_PATH/bin:$PATH"

WORKDIR /app

# # 安裝 PyTorch GPU 版 (CUDA 12.8)
# RUN python -m pip install --upgrade pip \
#  && python -m pip install torch torchvision torchaudio \
#       --index-url https://download.pytorch.org/whl/cu128

# 2) 先只複製 requirements 以利層快取（requirements.txt 放在 rtsp/ 目錄）
COPY requirements.txt /app/requirements.txt

# 3) 使用 BuildKit 的 pip 快取（下次 build 幾秒就好）
RUN --mount=type=cache,target=/root/.cache/pip \
    python3 -m pip install --upgrade pip && \
    python3 -m pip install -r /app/requirements.txt
COPY src/cctv/ /app/

# ENTRYPOINT ["python3", "yolo-rtsp-security-cam.py"]
# CMD [ "executable" ]
# CMD ["/bin/bash"]
ENTRYPOINT ["python3", "yolo-rtsp-security-cam.py"]