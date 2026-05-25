# Image Roller

GPT 批量生图小工具。用 ChatGPT 订阅批量生成 gpt-image-2 图片。

## 功能

- 批量生成 + 并发控制
- 改图 / Canvas 圈选编辑
- 多账号号池，自动轮询
- 对话分支，重抽 / 编辑
- 图片自动保存到本地

## 启动

```bash
cd backend && npm install && cd ..
npm start
```

浏览器打开 http://localhost:8180，在设置里 OAuth 登录 ChatGPT 账号即可使用。

## License

- 前端：MIT
- 后端：GPL-3.0（[AIClient-2-API](https://github.com/justlovemaki/AIClient-2-API)）
