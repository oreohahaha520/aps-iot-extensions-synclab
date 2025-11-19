# 使用 Node.js 22 官方 base image (Debian Bookworm slim)
FROM node:22-slim

# 設定工作目錄
WORKDIR /app

# 安裝依賴（先複製 package.json 避免每次 build 都重跑）
COPY package*.json ./
RUN npm ci --omit=dev


# 切換成官方內建的 node 使用者
RUN chown -R node:node /app
USER node

# 複製程式碼
COPY . .

# 開放埠口
EXPOSE 3000

# 啟動程式
# CMD ["npm", "run", "start"]
CMD ["node", "src/server.js"]