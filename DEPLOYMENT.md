# 阿里云服务器部署指南

## 部署前准备

### 1. 服务器要求
- 操作系统：Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- 内存：至少 2GB RAM（推荐 4GB+）
- 硬盘：至少 20GB 可用空间
- 已开放端口：3000（前端）、8000（后端）、5432（PostgreSQL）、6379（Redis）

### 2. 需要的信息
- 服务器公网 IP 地址
- SSH 登录用户名和密码/密钥

## 部署步骤

### 方式一：使用 Docker Compose 部署（推荐）

#### 步骤 1：连接到服务器
```bash
ssh root@你的服务器IP
# 或
ssh 用户名@你的服务器IP
```

#### 步骤 2：安装 Docker 和 Docker Compose

**Ubuntu/Debian:**
```bash
# 更新包管理器
sudo apt-get update

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt-get install docker-compose-plugin

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 添加当前用户到 docker 组（可选）
sudo usermod -aG docker $USER
```

**CentOS/Rocky Linux:**
```bash
# 更新包管理器
sudo yum update -y

# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 安装 Docker Compose
sudo yum install -y docker-compose-plugin

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker
```

#### 步骤 3：上传项目文件

**方式 A：使用 SCP 上传**
```bash
# 在本地电脑执行，将项目上传到服务器
scp -r C:\Users\fjl18\Desktop\test root@你的服务器IP:/root/
```

**方式 B：使用 Git 克隆（推荐）**
```bash
# 在服务器上执行
cd /root
git clone <你的仓库地址> test
cd test
```

#### 步骤 4：配置环境变量

```bash
cd /root/test

# 修改 docker-compose.yml 中的服务器 IP
# 将 NEXT_PUBLIC_API_URL 中的 localhost 改为你的服务器公网 IP
sudo sed -i 's/localhost/你的服务器IP/g' docker-compose.yml
```

#### 步骤 5：启动服务

```bash
# 构建并启动所有服务
sudo docker-compose up -d --build

# 查看服务状态
sudo docker-compose ps

# 查看日志
sudo docker-compose logs -f
```

#### 步骤 6：配置防火墙（如有）

**阿里云安全组规则：**
在阿里云控制台添加以下入方向规则：
- 端口 3000：允许访问（前端）
- 端口 8000：允许访问（后端 API）
- 端口 5432：可选（仅本地访问）
- 端口 6379：可选（仅本地访问）

**服务器防火墙（如有）：**
```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
sudo ufw enable

# CentOS/Rocky Linux
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

#### 步骤 7：验证部署

访问以下地址验证：
- 前端：`http://你的服务器IP:3000`
- 后端 API：`http://你的服务器IP:8000/docs`

### 方式二：手动部署

#### 步骤 1：安装 Python 3.10+
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y python3.10 python3.10-venv python3-pip

# CentOS/Rocky Linux
sudo yum install -y python3 python3-pip
```

#### 步骤 2：安装 Node.js 18+
```bash
# 使用 NodeSource 仓库安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs  # Ubuntu/Debian

# 或
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs  # CentOS/Rocky Linux
```

#### 步骤 3：安装 PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get install -y postgresql postgresql-contrib

# CentOS/Rocky Linux
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 步骤 4：安装 Redis
```bash
# Ubuntu/Debian
sudo apt-get install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# CentOS/Rocky Linux
sudo yum install -y redis
sudo systemctl start redis
sudo systemctl enable redis
```

#### 步骤 5：配置数据库
```bash
# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE stock_analysis;
CREATE USER stockuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE stock_analysis TO stockuser;
\q
```

#### 步骤 6：部署后端
```bash
cd /root/test/backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
export DATABASE_URL="postgresql+asyncpg://stockuser:yourpassword@localhost/stock_analysis"
export REDIS_URL="redis://localhost:6379/0"
export CORS_ORIGINS="http://你的服务器IP:3000"

# 启动后端（使用 nohup 后台运行）
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

#### 步骤 7：部署前端
```bash
cd /root/test/frontend

# 安装依赖
npm install

# 配置环境变量
echo "NEXT_PUBLIC_API_URL=http://你的服务器IP:8000" > .env.local

# 构建生产版本
npm run build

# 启动前端（使用 nohup 后台运行）
nohup npm start &
```

## 常用管理命令

### Docker Compose 方式

```bash
# 查看服务状态
sudo docker-compose ps

# 查看日志
sudo docker-compose logs -f

# 重启服务
sudo docker-compose restart

# 停止服务
sudo docker-compose down

# 更新代码后重新部署
sudo docker-compose down
sudo docker-compose up -d --build

# 进入后端容器
sudo docker-compose exec backend bash

# 进入数据库
sudo docker-compose exec postgres psql -U postgres stock_analysis
```

### 手动部署方式

```bash
# 查看后端日志
tail -f /path/to/backend.log

# 重启后端
pkill -f uvicorn
cd /root/test/backend
source venv/bin/activate
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# 重启前端
pkill -f node
cd /root/test/frontend
nohup npm start &
```

## 域名配置（可选）

### 使用 Nginx 反向代理

#### 安装 Nginx
```bash
sudo apt-get install -y nginx  # Ubuntu/Debian
sudo yum install -y nginx  # CentOS/Rocky Linux
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 配置 Nginx
创建配置文件 `/etc/nginx/sites-available/stock-analysis`：

```nginx
# 前端代理
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或服务器IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

#### 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/stock-analysis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL 证书配置（可选）

### 使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 故障排查

### 问题 1：无法访问前端
```bash
# 检查容器状态
sudo docker-compose ps

# 查看前端日志
sudo docker-compose logs frontend

# 确认端口 3000 已开放
sudo netstat -tlnp | grep 3000
```

### 问题 2：后端 API 无响应
```bash
# 查看后端日志
sudo docker-compose logs backend

# 检查数据库连接
sudo docker-compose exec backend python -c "from app.core.database import engine; print(engine)"
```

### 问题 3：数据库连接失败
```bash
# 检查 PostgreSQL 容器
sudo docker-compose logs postgres

# 进入数据库测试
sudo docker-compose exec postgres psql -U postgres stock_analysis
```

### 问题 4：端口冲突
```bash
# 查看端口占用
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :8000

# 停止占用端口的服务
sudo systemctl stop nginx  # 如果是 Nginx 占用
```

## 性能优化建议

1. **使用生产级数据库配置**
   - 调整 PostgreSQL 共享内存配置
   - 配置 Redis 持久化

2. **配置 Nginx 负载均衡**
   - 多实例部署
   - 负载均衡配置

3. **启用 CDN**
   - 静态资源 CDN 加速

4. **配置自动备份**
   - 数据库定期备份
   - 应用代码版本控制

## 维护命令

```bash
# 数据库备份
sudo docker-compose exec postgres pg_dump -U postgres stock_analysis > backup_$(date +%Y%m%d).sql

# 清理 Docker 资源
sudo docker system prune -a

# 查看磁盘使用
df -h
```
