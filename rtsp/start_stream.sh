#!/bin/bash

# --- 1. 配置變數 (請在這裡替換您的 RTSP 網址) ---

# 將您的 RTSP 串流網址放在這裡，程式會從這個環境變數讀取
RTSP_URL="rtsp://admin:cctv-8888@220.130.204.161:504/unicast/c3/s1/live"

# 映像檔名稱 (與您建置的 Dockerfile 保持一致)
IMAGE_NAME="rtsp:v_3"

# 容器內部 Web 服務的埠口
CONTAINER_PORT="5000"

# 本機要使用的埠口
HOST_PORT="5000"


# --- 2. 啟動檢查與運行 ---

echo "--- 啟動 Docker RTSP Web 串流服務 ---"
echo "映像檔: $IMAGE_NAME"
echo "RTSP URL: $RTSP_URL"
echo "埠口映射: $HOST_PORT -> $CONTAINER_PORT"
echo "注意: 運行需要 NVIDIA Container Toolkit 支援 (--gpus all)"
echo "----------------------------------------"

# 使用 docker run 啟動容器
# -e RTSP_URL=$RTSP_URL: 將 RTSP 網址作為環境變數傳遞給容器
# --gpus all: 啟用 GPU 支援
# -p $HOST_PORT:$CONTAINER_PORT: 映射埠口
# --rm -it: 互動模式並在退出後自動刪除容器
docker run --rm -it \
    --gpus all \
    -p $HOST_PORT:$CONTAINER_PORT \
    -e RTSP_URL="$RTSP_URL" \
    $IMAGE_NAME
    
# 提示使用者如何訪問
echo "----------------------------------------"
echo "服務已停止或正在背景運行..."
echo "如果服務成功啟動，您應該可以在瀏覽器中訪問以下網址查看串流："
echo "http://localhost:$HOST_PORT/video_feed"