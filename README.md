# Image Roller

用自己的 ChatGPT 订阅批量生图的本地工具。支持多账号轮询、分支对话、Canvas 圈选编辑、宽高比切换。

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
