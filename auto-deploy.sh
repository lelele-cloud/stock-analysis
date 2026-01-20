#!/bin/bash

# 阿里云服务器自动部署脚本
# 使用方法: bash auto-deploy.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVER_IP="8.148.245.222"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  StockAnalysis 自动部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "服务器 IP: ${GREEN}$SERVER_IP${NC}"
echo ""

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    echo -e "${GREEN}操作系统: $PRETTY_NAME${NC}"
else
    echo -e "${RED}无法检测操作系统${NC}"
    exit 1
fi

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 root 用户或 sudo 执行此脚本${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[1/8] 更新系统包...${NC}"
sleep 1

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update -qq
    apt-get upgrade -y -qq
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "rocky" ]; then
    yum update -y -qq
fi

echo -e "${GREEN}✓ 系统更新完成${NC}"

echo ""
echo -e "${YELLOW}[2/8] 安装 Docker 和 Docker Compose...${NC}"
sleep 1

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    # 安装 Docker
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
    fi

    # 安装 Docker Compose
    if ! command -v docker &> /dev/null; then
        apt-get install -y docker-compose-plugin
    fi

    systemctl start docker
    systemctl enable docker
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "rocky" ]; then
    # 安装 Docker
    if ! command -v docker &> /dev/null; then
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io
    fi

    # 安装 Docker Compose
    if ! command -v docker &> /dev/null; then
        yum install -y docker-compose-plugin
    fi

    systemctl start docker
    systemctl enable docker
fi

echo -e "${GREEN}✓ Docker 安装完成${NC}"

echo ""
echo -e "${YELLOW}[3/8] 配置防火墙...${NC}"
sleep 1

# 开放必要端口
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    if command -v ufw &> /dev/null; then
        ufw allow 3000/tcp
        ufw allow 8000/tcp
        echo -e "${GREEN}✓ 已开放端口: 3000, 8000${NC}"
    else
        echo -e "${YELLOW}○ ufw 未安装，跳过防火墙配置${NC}"
    fi
elif [ "$OS" = "centos" ] || [ "$OS" = "rocky" ] || [ "$OS" = "rhel" ]; then
    if command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --permanent --add-port=8000/tcp
        firewall-cmd --reload
        echo -e "${GREEN}✓ 已开放端口: 3000, 8000${NC}"
    else
        echo -e "${YELLOW}○ firewalld 未安装，跳过防火墙配置${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}[4/8] 停止旧容器...${NC}"
sleep 1

cd /root

# 如果项目目录已存在，先停止容器
if [ -d "stock-analysis" ]; then
    cd stock-analysis
    docker-compose down 2>/dev/null || true
    cd ..
fi

echo -e "${GREEN}✓ 旧容器已停止${NC}"

echo ""
echo -e "${YELLOW}[5/8] 拉取/更新项目...${NC}"
sleep 1

# 如果是 Git 仓库，拉取最新代码
if [ -d "stock-analysis/.git" ]; then
    cd stock-analysis
    git pull
else
    # 如果不是，从压缩包或其他方式获取
    if [ -f "stock-analysis.zip" ]; then
        unzip -o stock-analysis.zip
        rm stock-analysis.zip
    fi
fi

echo -e "${GREEN}✓ 项目已就绪${NC}"

echo ""
echo -e "${YELLOW}[6/8] 启动服务...${NC}"
sleep 1

cd /root/stock-analysis

# 停止可能存在的旧容器
docker-compose down 2>/dev/null || true

# 构建并启动
docker-compose up -d --build

echo ""
echo -e "${YELLOW}[7/8] 等待服务启动...${NC}"
sleep 15

echo ""
echo -e "${YELLOW}[8/8] 验证服务状态...${NC}"
sleep 2

# 检查容器状态
containers_running=$(docker-compose ps | grep -c "Up" || true)
total_containers=4

echo -e "${BLUE}容器状态:${NC}"
docker-compose ps

# 验证服务
echo ""
echo -e "${BLUE}服务验证:${NC}"

# 检查前端
sleep 5
if curl -s "http://localhost:3000" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端服务正常 - http://$SERVER_IP:3000${NC}"
else
    echo -e "${YELLOW}○ 前端服务启动中，请稍后访问 http://$SERVER_IP:3000${NC}"
fi

# 检查后端
sleep 3
if curl -s "http://localhost:8000/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务正常 - http://$SERVER_IP:8000${NC}"
else
    echo -e "${YELLOW}○ 后端服务启动中，请稍后检查${NC}"
fi

# 检查数据库
if docker-compose ps | grep postgres | grep -q "Up"; then
    echo -e "${GREEN}✓ 数据库服务正常${NC}"
else
    echo -e "${RED}✗ 数据库服务异常${NC}"
fi

# 检查 Redis
if docker-compose ps | grep redis | grep -q "Up"; then
    echo -e "${GREEN}✓ 缓存服务正常${NC}"
else
    echo -e "${RED}✗ 缓存服务异常${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}访问地址：${NC}"
echo -e "  ${BLUE}前端界面:${NC} ${GREEN}http://$SERVER_IP:3000${NC}"
echo -e "  ${BLUE}后端 API:${NC} ${GREEN}http://$SERVER_IP:8000${NC}"
echo -e "  ${BLUE}API 文档:${NC} ${GREEN}http://$SERVER_IP:8000/docs${NC}"
echo ""
echo -e "${YELLOW}常用管理命令：${NC}"
echo "  查看状态: cd /root/stock-analysis && sudo docker-compose ps"
echo "  查看日志: cd /root/stock-analysis && sudo docker-compose logs -f [服务名]"
echo "  重启服务: cd /root/stock-analysis && sudo docker-compose restart"
echo "  停止服务: cd /root/stock-analysis && sudo docker-compose down"
echo "  进入后端: cd /root/stock-analysis && sudo docker-compose exec backend bash"
echo ""
echo -e "${YELLOW}如遇问题，查看日志：${NC}"
echo "  sudo docker-compose logs backend"
echo "  sudo docker-compose logs frontend"
echo ""
echo -e "${YELLOW}快速健康检查：${NC}"
echo "  curl http://$SERVER_IP:8000/health"
echo ""