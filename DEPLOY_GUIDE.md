# StockAnalysis 部署指南

## 服务器信息

- **服务器 IP**: 8.148.245.222
- **操作系统**: 支持 Ubuntu/Debian/CentOS/Rocky Linux
- **部署方式**: Docker + Docker Compose

## 部署步骤

### 方式一：使用 Git 部署（推荐）

1. **在服务器上克隆项目**
   ```bash
   ssh root@8.148.245.222
   cd ~
   git clone <你的Git仓库地址> stock-analysis
   cd stock-analysis
   ```

2. **运行自动部署脚本**
   ```bash
   bash auto-deploy.sh
   ```

### 方式二：使用 SCP 上传部署

1. **在本地打包项目**
   ```cmd
   # 运行部署助手.bat
   部署助手.bat
   ```

2. **上传到服务器**
   ```bash
   scp deploy_pkg\stock-analysis.zip root@8.148.245.222:/root/
   ```

3. **在服务器上解压并部署**
   ```bash
   ssh root@8.148.245.222
   cd /root
   unzip stock-analysis.zip
   cd stock-analysis
   bash auto-deploy.sh
   ```

## 自动部署脚本说明

`auto-deploy.sh` 会自动执行以下步骤：

1. **[1/8] 更新系统包** - 更新操作系统
2. **[2/8] 安装 Docker** - 安装 Docker 和 Docker Compose
3. **[3/8] 配置防火墙** - 开放端口 3000 和 8000
4. **[4/8] 停止旧容器** - 停止可能存在的旧服务
5. **[5/8] 拉取/更新项目** - 获取最新代码
6. **[6/8] 启动服务** - 构建并启动所有容器
7. **[7/8] 等待服务启动** - 等待服务初始化
8. **[8/8] 验证服务状态** - 检查各服务运行状态

## 访问地址

部署完成后，可通过以下地址访问：

- **前端界面**: http://8.148.245.222:3000
- **后端 API**: http://8.148.245.222:8000
- **API 文档**: http://8.148.245.222:8000/docs

## 常用管理命令

```bash
# 进入项目目录
cd /root/stock-analysis

# 查看服务状态
sudo docker-compose ps

# 查看服务日志
sudo docker-compose logs -f              # 所有服务
sudo docker-compose logs -f backend      # 后端日志
sudo docker-compose logs -f frontend     # 前端日志
sudo docker-compose logs -f postgres     # 数据库日志

# 重启服务
sudo docker-compose restart

# 停止服务
sudo docker-compose down

# 进入后端容器
sudo docker-compose exec backend bash

# 健康检查
curl http://8.148.245.222:8000/health
```

## 服务说明

项目包含以下 Docker 服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| frontend | 3000 | Next.js 前端界面 |
| backend | 8000 | FastAPI 后端 API |
| postgres | 5432 | PostgreSQL 数据库 |
| redis | 6379 | Redis 缓存服务 |

## 故障排查

### 前端无法访问

1. 检查服务状态：`sudo docker-compose ps`
2. 查看前端日志：`sudo docker-compose logs frontend`
3. 检查端口是否开放：`netstat -tlnp | grep 3000`

### 后端无法访问

1. 检查服务状态：`sudo docker-compose ps`
2. 查看后端日志：`sudo docker-compose logs backend`
3. 检查健康状态：`curl http://localhost:8000/health`

### 数据库连接问题

1. 检查数据库状态：`sudo docker-compose ps postgres`
2. 查看数据库日志：`sudo docker-compose logs postgres`
3. 检查数据库连接：`sudo docker-compose exec backend python -c "import asyncio; from app.core.database import test_connection; asyncio.run(test_connection())"`

## 防火墙配置

如果无法从外部访问，请检查防火墙配置：

```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp

# CentOS/Rocky
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

## 阿里云安全组

记得在阿里云控制台配置安全组规则：

| 端口 | 协议 | 来源 |
|------|------|------|
| 3000 | TCP | 0.0.0.0/0 |
| 8000 | TCP | 0.0.0.0/0 |
