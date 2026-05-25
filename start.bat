@echo off
chcp 65001 > nul
title 生图器 · 启动器

echo ========================================
echo  生图器 (gpt-image-2 抽卡器)
echo ========================================
echo.

REM 检查 Node
where node > nul 2>&1
if errorlevel 1 (
  echo [ERROR] 没找到 node，请先装 Node.js 22+
  pause
  exit /b 1
)

REM 检查 backend 目录
if not exist "%~dp0backend\node_modules" (
  echo [ERROR] backend\node_modules 不存在，第一次运行请先 cd backend ^&^& npm install
  pause
  exit /b 1
)

REM 检查端口冲突
netstat -ano | findstr :7777 | findstr LISTENING > nul
if not errorlevel 1 echo [WARN] 端口 7777 已被占用，反代可能已在跑
netstat -ano | findstr :8080 | findstr LISTENING > nul
if not errorlevel 1 echo [WARN] 端口 8080 已被占用，前端可能已在跑

echo [启动] 反代后端 (端口 7777)...
cd /d "%~dp0backend"
start "生图器反代" cmd /k "title 生图器反代 ^& npm start"

echo [启动] 前端服务 (端口 8080)...
cd /d "%~dp0"
start "生图器前端" cmd /k "title 生图器前端 ^& node serve.js"

echo [等待] 服务启动 (5s)...
timeout /t 5 /nobreak > nul

echo [打开] 浏览器 http://localhost:8080/
start "" "http://localhost:8080/"

echo.
echo ========================================
echo  全部启动完成
echo ========================================
echo  - 前端: http://localhost:8180/
echo  - 反代: http://127.0.0.1:7780
echo.
echo  关闭这个窗口不影响运行
echo  停服务：关闭 "生图器反代" 和 "生图器前端" 两个窗口
echo.
pause
