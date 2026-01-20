#!/bin/bash

# 阿里云服务器一键部署脚本
# 使用方法：bash deploy.sh <服务器IP> <用户名>

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVER_IP=$1
USERNAME=${2:-root}

if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}错误: 请提供服务器 IP 地址${NC}"
    echo "使用方法: bash deploy.sh <服务器IP> [用户名]"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  阿里云服务器部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "服务器 IP: $SERVER_IP"
echo "用户名: $USERNAME"
echo ""

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    echo -e "${GREEN}检测到操作系统: $PRETTY_NAME${NC}"
else
    echo -e "${RED}无法检测操作系统${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}步骤 1/7: 安装 Docker 和 Docker Compose...${NC}"
sleep 1

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt-get update -qq
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo apt-get install -y docker-compose-plugin
    sudo systemctl start docker
    sudo systemctl enable docker
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "rocky" ]; then
    sudo yum update -y -qq
    sudo yum install -y yum-utils
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    sudo yum install -y docker-ce docker-ce-cli containerd.io
    sudo yum install -y docker-compose-plugin
    sudo systemctl start docker
    sudo systemctl enable docker
else
    echo -e "${RED}不支持的操作系统: $OS${NC}"
    exit 1
fi

echo -e "${GREEN}Docker 安装完成${NC}"
echo ""

echo -e "${YELLOW}步骤 2/7: 创建项目目录...${NC}"
sleep 1
# 这里假设项目已经上传到服务器
PROJECT_DIR="/root/stock-analysis"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}项目目录不存在，请先上传项目文件${NC}"
    echo "项目应上传到: $PROJECT_DIR"
    exit 1
fi
cd "$PROJECT_DIR"

echo -e "${GREEN}项目目录: $PROJECT_DIR${NC}"
echo ""

echo -e "${YELLOW}步骤 3/7: 配置环境变量...${NC}"
sleep 1
# 备份原配置
cp docker-compose.yml docker-compose.yml.bak

# 修改服务器 IP
sed -i "s/localhost/$SERVER_IP/g" docker-compose.yml

echo -e "${GREEN}已配置服务器 IP: $SERVER_IP${NC}"
echo ""

echo -e "${YELLOW}步骤 4/7: 停止旧服务（如有）...${NC}"
sleep 1
sudo docker-compose down 2>/dev/null || true

echo -e "${GREEN}旧服务已停止${NC}"
echo ""

echo -e "${YELLOW}步骤 5/7: 构建并启动服务...${NC}"
sleep 1
sudo docker-compose up -d --build

echo ""
echo -e "${YELLOW}步骤 6/7: 等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo ""
sudo docker-compose ps

echo ""
echo -e "${YELLOW}步骤 7/7: 验证服务状态...${NC}"
sleep 2

# 检查前端
if curl -s "http://localhost:3000" > /dev/null; then
    echo -e "${GREEN}✓ 前端服务运行正常${NC}"
else
    echo -e "${YELLOW}○ 前端服务启动中...请稍后访问 http://$SERVER_IP:3000${NC}"
fi

# 检查后端
if curl -s "http://localhost:8000/health" > /dev/null; then
    echo -e "${GREEN}✓ 后端服务运行正常${NC}"
else
    echo -e "${YELLOW}○ 后端服务启动中...请稍后检查${NC}"
fi

# 检查数据库
if sudo docker-compose ps | grep postgres | grep -q "Up"; then
    echo -e "${GREEN}✓ 数据库服务运行正常${NC}"
else
    echo -e "${RED}✗ 数据库服务未运行${NC}"
fi

# 检查 Redis
if sudo docker-compose ps | grep redis | grep -q "Up"; then
    echo -e "${GREEN}✓ 缓存服务运行正常${NC}"
else
    echo -e "${RED}✗ 缓存服务未运行${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}访问地址：${NC}"
echo -e "  前端: ${GREEN}http://$SERVER_IP:3000${NC}"
echo -e "  后端 API: ${GREEN}http://$SERVER_IP:8000/docs${NC}"
echo -e "  API 文档: ${GREEN}http://$SERVER_IP:8000/docs${NC}"
echo ""
echo -e "${YELLOW}常用命令：${NC}"
echo "  查看状态: sudo docker-compose ps"
echo "  查看日志: sudo docker-compose logs -f"
echo "  重启服务: sudo docker-compose restart"
echo "  停止服务: sudo docker-compose down"
echo ""
echo -e "${YELLOW}如遇问题，请查看日志：${NC}"
echo "  sudo docker-compose logs backend"
echo "  sudo docker-compose logs frontend"
