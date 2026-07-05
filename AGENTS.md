# AGENTS.md

## 项目名称

黑箱侦探社 / Blackbox Detective Agency

## 项目类型

Web 版单人 AI 审讯破案游戏 MVP。

玩家扮演侦探，通过调查地点、审问嫌疑人、收集证据、发现矛盾，最终提交结案报告并获得系统判定。

本项目不是普通聊天应用，也不是视觉小说，而是一个“结构化案件 + 自由审问 + 证据驱动推理”的侦探游戏。

---

## 后续开发前必须阅读

后续所有 Codex 开发任务，都必须先阅读并遵循以下规范文件：

1. `docs/00_project_overview.md`
2. `docs/01_technical_architecture.md`
3. `docs/02_domain_model.md`
4. `docs/03_case_design.md`
5. `docs/04_interrogation_and_evidence_rules.md`
6. `docs/05_frontend_interaction_spec.md`
7. `docs/06_backend_api_spec.md`
8. `docs/07_development_constraints_and_acceptance.md`

---

## 核心原则

1. 案件真相必须由后端 Case Bible 固定，不能在对话中临场改变。
2. LLM 或 Mock LLM 只负责角色扮演、文本生成、玩家意图解析，不负责最终真相判定。
3. NPC 有知识边界，不能知道或泄露超出自己角色设定的信息。
4. 玩家可以自由输入问题，但系统必须防止 prompt injection 泄露隐藏真相。
5. 游戏核心循环是：调查 → 审讯 → 发现证据 → 命中矛盾 → 整理推理链 → 提交结案报告。
6. MVP 默认使用 Mock LLM，不能依赖真实 API Key。
7. 前端不能在结案前获得隐藏真相。
8. 最终判定必须是规则化、确定性的。
