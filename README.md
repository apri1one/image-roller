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

浏览器打开 http://localhost:8180

## 添加 ChatGPT 账号

1. 点齿轮 ⚙ 打开设置
2. 点「+ 添加账号」
3. 输入标签（如"主号"）→ 点「开始 OAuth」
4. 浏览器自动打开 OpenAI 登录页，用你的 ChatGPT 账号登录
5. 完成后账号自动入号池

## 使用建议

- 并发数 ≤ 4，填 5 就会被限流
- 多账号可以提高总吞吐（每个号独立限速）
- thinking 模式质量更好但更慢，instant 模式更快

## License

- 前端：MIT
- 后端：GPL-3.0（[AIClient-2-API](https://github.com/justlovemaki/AIClient-2-API)）
