# 黑箱侦探社 / Blackbox Detective Agency

Web 版单人悬疑审讯破案游戏 MVP。玩家扮演侦探，在《雨夜剧院谋杀案》中调查地点、审问嫌疑人、收集证据、发现矛盾，并提交结案报告。

## 技术栈

- Client: Phaser 4 + TypeScript + Vite
- Server: Node.js + Express + TypeScript
- Shared Types: `shared/types.ts`
- LLM: 默认 Mock Provider，不需要 API Key
- Package Manager: npm

## 安装

```bash
npm install
```

## 开发启动

同时启动前端和后端：

```bash
npm run dev
```

单独启动：

```bash
npm run dev:client
npm run dev:server
```

默认地址：

- Client: http://localhost:5173
- Server: http://localhost:3001
- Health: http://localhost:3001/api/health

## 构建与类型检查

```bash
npm run build
npm run typecheck
```

## 说明

MVP 使用固定 Case Bible 和 Mock LLM。前端结案前不会获得隐藏真相；最终评分由后端规则系统确定。

## 后续接入真实 LLM 的注意事项

当前默认 `LLM_PROVIDER=mock`，不需要 API Key。后续接入真实 LLM 时，应只替换 `/server/src/services/llm` 下的 Provider 实现，不能改变案件权威边界。

- API key 只能放在后端环境变量，不能写入前端代码或提交到仓库。
- 不允许前端直接请求 LLM，所有对话必须经过后端服务过滤和状态更新。
- 案件真相必须先结构化冻结为 Case Bible，再进入审讯流程。
- NPC 不应该知道完整 Case Bible，只能看到自己的知识、会隐瞒的内容、玩家已发现证据和当前状态。
- 最终结案必须走后端规则判定，不能让 LLM 临场决定真凶、动机、手段或评分。

这样做是为了保证侦探游戏的公平性：LLM 可以负责语气、自然语言和意图解析，但不能临场改写真相。否则玩家收集的证据链会失去稳定依据，案件也会从“可推理的结构化谜题”退化成不可验证的聊天结果。
