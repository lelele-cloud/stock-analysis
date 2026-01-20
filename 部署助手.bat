@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   StockAnalysis 项目部署助手
echo ========================================
echo.

set /p SERVER_IP="请输入服务器IP地址 (默认: 8.148.245.222): "
if "%SERVER_IP%"=="" set SERVER_IP=8.148.245.222

echo.
echo ========================================
echo   选择部署方式
echo ========================================
echo.
echo 1. 使用 Git (推荐)
echo 2. 使用 SCP 上传
echo.
set /p CHOICE="请选择 (1/2): "

if "%CHOICE%"=="1" goto GIT_DEPLOY
if "%CHOICE%"=="2" goto SCP_DEPLOY
echo 无效选择，退出
exit /b 1

:GIT_DEPLOY
echo.
echo ========================================
echo   Git 部署方式
echo ========================================
echo.
echo 请按以下步骤操作：
echo.
echo 1. 在服务器上执行：
echo    mkdir -p ~/projects
echo    cd ~/projects
echo    git clone ^<你的Git仓库地址^>
echo    cd stock-analysis
echo    bash auto-deploy.sh
echo.
echo 2. 等待部署完成，访问：
echo    http://%SERVER_IP%:3000
echo.

pause
exit /b 0

:SCP_DEPLOY
echo.
echo ========================================
echo   SCP 上传部署方式
echo ========================================
echo.

REM 打包项目（如果还没打包）
cd /d %USERPROFILE%\Desktop\test

echo 正在打包项目...
if exist deploy_temp rd /s /q deploy_temp 2>nul
mkdir deploy_temp
xcopy /E /I /Y /exclude node_modules /exclude .next /exclude __pycache__ /exclude *.pyc /exclude .git deploy_temp >nul 2>&1

REM 创建打包目录
if not exist deploy_pkg mkdir deploy_pkg

REM 打包
cd deploy_temp
powershell -Command "Compress-Archive -Path * -DestinationPath ..\deploy_pkg\stock-analysis.zip -Force" 2>nul
cd ..

REM 清理
rd /s /q deploy_temp

echo.
echo 项目已打包到: %CD%\deploy_pkg\stock-analysis.zip
echo.
echo ========================================
echo   上传项目到服务器
echo ========================================
echo.
echo 请使用以下命令上传（根据你的认证方式选择）：
echo.
echo 方式1 - 使用 SSH 密钥（推荐）：
echo   scp deploy_pkg\stock-analysis.zip root@%SERVER_IP%:/root/
echo.
echo 方式2 - 使用密码：
echo   scp deploy_pkg\stock-analysis.zip root@%SERVER_IP%:/root/
echo.
echo 上传完成后，在服务器上执行：
echo   unzip stock-analysis.zip
echo   cd stock-analysis
echo   bash auto-deploy.sh
echo.

pause
exit /b 0
