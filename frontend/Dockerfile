# 前端 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 配置 npm 使用淘宝镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制依赖文件
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm install

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "run", "dev"]
