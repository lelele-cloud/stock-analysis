@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   项目文件打包工具
echo ========================================
echo.

REM 设置服务器信息
set /p SERVER_IP="请输入服务器IP地址: "
set /p USERNAME="请输入SSH用户名(默认root): "
if "%USERNAME%"=="" set USERNAME=root

REM 打包项目文件
echo.
echo 正在打包项目文件...
cd /d %USERPROFILE%\Desktop\test

REM 创建临时打包目录
if exist deploy_temp rd /s /q deploy_temp
mkdir deploy_temp

REM 复制项目文件
xcopy /E /I /Y /exclude node_modules /exclude .next /exclude __pycache__ /exclude *.pyc deploy_temp

REM 打包成 zip
echo 正在压缩...
cd deploy_temp
powershell -Command "Compress-Archive -Path * -DestinationPath ..\stock-analysis.zip -Force"
cd ..

REM 清理临时文件
rd /s /q deploy_temp

echo.
echo ========================================
echo   打包完成！
echo ========================================
echo.
echo 项目文件已保存到: %USERPROFILE%\Desktop\stock-analysis.zip
echo.

REM 显示上传命令
echo ========================================
echo   上传到服务器的命令：
echo ========================================
echo.
echo 方式1: 使用 SCP（推荐）
echo   scp stock-analysis.zip %USERNAME%@%SERVER_IP%:/root/
echo.
echo 方式2: 使用 WinSCP
echo   1. 下载 WinSCP: https://winscp.net/
echo   2. 连接到服务器
echo   3. 上传 stock-analysis.zip 文件
echo.
echo 方式3: 使用 Git（推荐）
echo   如果你有 Git 仓库：
echo   1. 在服务器上执行: git clone ^<你的仓库地址^>
echo   2. cd test
echo   3. 运行部署脚本
echo.

pause
