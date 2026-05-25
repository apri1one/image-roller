# Image Roller

GPT 批量生图小工具。用 ChatGPT 订阅批量生成 gpt-image-2 图片，本地部署，支持并发生成、多账号轮询、对话管理。

## 功能

- **批量抽卡** — 输入 prompt + 张数，并发生成多张候选图
- **改图模式** — 拖入 / 粘贴参考图，基于原图编辑生成
- **Canvas 圈选编辑** — 画笔选中区域 + prompt 局部修改
- **分支对话** — 树状结构，支持重抽、编辑 prompt、从任意节点 fork 新会话
- **宽高比切换** — 自动 / 1:1 / 3:4 / 9:16 / 4:3 / 16:9
- **多账号号池** — OAuth 登录，自动轮询 + 抖动反检测
- **图片自动落盘** — `output/` 目录按会话分文件夹保存
- **状态持久化** — localStorage + 磁盘双写，换端口 / 清缓存不丢数据

## 快速开始

### 前置条件

- Node.js 18+
- 至少一个 ChatGPT Plus / Pro 订阅账号

### 安装

```bash
git clone git@github.com:apri1one/image-roller.git
cd image-roller
cd backend && npm install && cd ..
```

### 配置

复制示例配置（首次运行）：

```bash
cp backend/configs/config.json.example backend/configs/config.json
```

编辑 `backend/configs/config.json`，设置 `REQUIRED_API_KEY`（随便填一个自定义密钥）。

serve.js 会自动从 `backend/configs/config.json` 读取这个 key，无需额外设环境变量。

### 启动

```bash
npm start
```

浏览器打开 http://localhost:8180

### 添加 ChatGPT 账号

1. 点齿轮 ⚙ 打开设置
2. 点「+ OAuth 登录」，按提示授权 ChatGPT 账号
3. 完成后点「🔄 同步号池」

### 使用建议

- 并发数建议 ≤ 4，过高易触发上游限流
- 多账号可提高总吞吐（每个号独立限速）
- thinking 模式质量更好但更慢

## 架构

```
浏览器 → http://localhost:8180（serve.js）
  ├── 静态文件（index.html）
  ├── /api/* → 图片保存 + 状态持久化
  └── /v1/* → proxy → backend:7780 → chatgpt.com
```

| 组件 | 说明 |
|---|---|
| `index.html` | 前端 UI（单文件，无构建） |
| `serve.js` | 静态服务 + 反代 + API |
| `start.js` | npm start 入口，同时启动后端 + 前端 |
| `backend/` | Codex OAuth 反代（AIClient-2-API） |

## 敏感文件（不要提交）

以下文件已在 `.gitignore` 中排除：

```
backend/configs/config.json      # API Key
backend/configs/pwd              # 管理密码
backend/configs/codex/*.json     # OAuth 凭据
backend/configs/token-store.json # Session token
output/                          # 生成的图片
```

## License

- 前端（index.html, serve.js, start.js）：MIT
- 后端（backend/）：GPL-3.0（继承自 [AIClient-2-API](https://github.com/justlovemaki/AIClient-2-API)）
