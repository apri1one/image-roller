# Image Roller

用自己的 ChatGPT 订阅批量生图的本地工具。支持多账号轮询、分支对话、Canvas 圈选编辑、宽高比切换。

![demo](https://img.shields.io/badge/status-beta-blue)

## 功能

- **批量抽卡** — 输入 prompt + 张数，并发生成多张候选图
- **分支对话** — ChatGPT 风格的对话树，支持重抽、编辑 prompt、基于某张图改
- **Canvas 圈选编辑** — 画笔选中区域 + prompt 局部修改（类似 ChatGPT Canvas）
- **宽高比切换** — 1:1 / 3:4 / 9:16 / 4:3 / 16:9，点击即可用新比例重新生成
- **多账号** — 添加多个 ChatGPT 订阅，自动轮询 + 抖动反检测
- **Ctrl+V 粘贴图片** — 直接粘贴作为参考图
- **复制到剪贴板** — 一键复制生成的图片
- **会话分支** — 从任意节点 fork 出新会话
- **数据持久化** — localStorage + IndexedDB，刷新不丢

## 架构

```
浏览器 → http://localhost:8180
         ├── 静态文件 → index.html
         ├── /api/save-image → 写磁盘
         └── /openai-codex-oauth/* → proxy → backend:7780 → chatgpt.com
```

- 前端：`index.html` 单文件（HTML + CSS + JS）
- 服务：`serve.js`（Node 内置 http，无 npm 依赖）
- 反代：`backend/`（基于 [AIClient-2-API](https://github.com/justlovemaki/AIClient-2-API)，Codex OAuth → gpt-image-2）

## 快速开始

### 前置条件

- Node.js 22+
- 至少一个 ChatGPT Plus / Pro 订阅账号

### 安装

```bash
git clone https://github.com/apri1one/image-roller.git
cd image-roller

# 安装后端依赖
cd backend && npm install && cd ..

# 复制配置文件
cp backend/configs/config.json.example backend/configs/config.json
```

编辑 `backend/configs/config.json`，设置你的 API Key：
```json
{
  "REQUIRED_API_KEY": "sk-随便填一个你自己的密钥",
  "SERVER_PORT": 7780
}
```

同时在 `serve.js` 同级目录设置环境变量（或直接编辑 `serve.js`）：
```bash
export BACKEND_API_KEY="sk-和上面一样的密钥"
```

创建管理密码文件：
```bash
echo "admin123" > backend/configs/pwd
```

### 启动

**Windows：**
```bash
start.bat
```

**手动：**
```bash
# 终端 1：启动反代
cd backend && npm start

# 终端 2：启动前端
node serve.js
```

浏览器打开 `http://localhost:8180`

### 添加 ChatGPT 账号

1. 点齿轮 ⚙ 打开设置
2. 点「+ 添加账号」
3. 输入标签（如"主号"）→ 点「开始 OAuth」
4. 浏览器自动打开 OpenAI 登录页，用你的 ChatGPT 账号登录
5. 完成后账号自动入号池

### 使用建议

- **并发数 ≤ 4**，填 5 就会被限流
- 多账号可以提高总吞吐（每个号独立限速）
- thinking 模式质量更好但更慢，instant 模式更快

## 敏感文件（不要提交）

以下文件已在 `.gitignore` 中排除：

```
backend/configs/config.json      # API Key
backend/configs/pwd              # 管理密码
backend/configs/codex/*.json     # OAuth 凭据（最重要！）
backend/configs/token-store.json # Session token
output/                          # 生成的图片
```

## 许可

- 前端（`index.html`, `serve.js`）：MIT
- 后端（`backend/`）：GPL-3.0（继承自 [AIClient-2-API](https://github.com/justlovemaki/AIClient-2-API)）
