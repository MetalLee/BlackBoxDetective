# 01 技术架构

## 技术栈

除非用户明确变更，否则使用以下技术栈。

### 前端

- Phaser 4
- TypeScript
- Vite
- 原生 CSS
- 必要时使用 HTML DOM Overlay 实现文本输入框

### 后端

- Node.js
- Express
- TypeScript

### 共享类型

前后端共用类型放在：

```text
/shared/types.ts
```

### 包管理器

使用 npm。

---

## 目标目录结构

```text
/
  AGENTS.md
  README.md
  package.json

  /docs
    00_project_overview.md
    01_technical_architecture.md
    02_domain_model.md
    03_case_design.md
    04_interrogation_and_evidence_rules.md
    05_frontend_interaction_spec.md
    06_backend_api_spec.md
    07_development_constraints_and_acceptance.md

  /client
    package.json
    index.html
    vite.config.ts
    /src
      main.ts
      game.ts
      /scenes
        BootScene.ts
        MainMenuScene.ts
        CaseScene.ts
        InterrogationScene.ts
        EvidenceBoardScene.ts
        FinalReportScene.ts
        ResultScene.ts
      /api
        clientApi.ts
      /state
        GameState.ts
      /ui
      /styles
        global.css

  /server
    package.json
    tsconfig.json
    /src
      index.ts
      /routes
        healthRoutes.ts
        caseRoutes.ts
        interrogationRoutes.ts
      /services
        CaseService.ts
        InvestigationService.ts
        InterrogationService.ts
        FinalReportService.ts
        /llm
          types.ts
          MockLlmProvider.ts
          ProviderFactory.ts
      /data
        mockCase.ts

  /shared
    types.ts
```

---

## 前后端职责划分

### 前端负责

- Phaser 游戏场景
- 玩家交互
- 地点、嫌疑人、证据板展示
- 审讯输入框
- 对话记录展示
- 最终报告填写
- 结果展示
- 本地临时存档

### 后端负责

- 案件状态
- 隐藏真相 Case Bible
- 证据是否发现
- 嫌疑人状态
- 矛盾是否命中
- 审讯逻辑
- 地点调查逻辑
- 最终评分

---

## LLM Provider 架构

即使 MVP 使用 Mock 逻辑，也必须预留真实 LLM 接入结构。

推荐文件：

```text
/server/src/services/llm/types.ts
/server/src/services/llm/MockLlmProvider.ts
/server/src/services/llm/ProviderFactory.ts
```

默认配置：

```text
LLM_PROVIDER=mock
```

如果设置为非 mock provider，但未实现真实 provider，应抛出明确错误：

```text
Real LLM provider is not implemented yet.
```

---

## LLM 使用边界

LLM 可以用于：

- NPC 自然语言回复
- 玩家问题意图识别
- 氛围文本生成
- 证词改写

LLM 不允许用于：

- 修改真凶
- 修改动机
- 修改作案手段
- 临场新增关键证据
- 最终判案
- 最终评分
- 向前端暴露 Case Bible

---

## 开发脚本要求

根目录 `package.json` 应提供：

```text
npm run dev
npm run dev:client
npm run dev:server
npm run build
npm run typecheck
```

要求：

- `npm run dev` 可以同时启动前端和后端。
- `npm run typecheck` 应尽量保持通过。
- Mock 模式下不需要任何 API Key。
