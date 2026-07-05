# 06 后端接口规范

## 后端目标

后端负责维护案件状态、隐藏真相、证据发现、审讯状态、矛盾命中和最终判定。

后端必须保证：

- 结案前不向前端暴露隐藏真相。
- 对话不能改变案件真相。
- 最终判定稳定、确定、可复现。
- Mock 模式无需 API Key。

---

## API 列表

### 健康检查

```http
GET /api/health
```

返回示例：

```json
{
  "ok": true
}
```

---

## 开始案件

```http
POST /api/case/start
```

作用：

- 创建一个新案件。
- 初始化案件状态。
- 返回前端可见案件数据。

要求：

- 不返回 Truth / Case Bible。
- 不暴露 `isCulprit` 等隐藏字段。
- 未发现证据的详细内容不能直接暴露。

---

## 获取案件状态

```http
GET /api/case/:caseId
```

作用：

- 返回当前案件的前端可见状态。

要求：

- 不返回隐藏真相。
- 返回已发现证据。
- 返回嫌疑人前端可见状态。
- 返回地点和基础案情信息。

---

## 调查地点

```http
POST /api/case/:caseId/investigate
```

请求体：

```json
{
  "locationId": "string",
  "targetId": "optional string"
}
```

响应体：

```json
{
  "narrativeText": "string",
  "newlyDiscoveredEvidenceIds": [],
  "unlockedLocationIds": [],
  "hint": "optional string"
}
```

规则：

- 每个证据只能首次发现一次。
- 重复调查应返回“这里已经调查过”的友好叙事。
- 新发现证据应写入案件状态。
- 红鲱鱼证据也可以被发现，但不能直接告诉玩家它是红鲱鱼。

---

## 审讯嫌疑人

```http
POST /api/interrogate
```

请求体：

```json
{
  "caseId": "string",
  "suspectId": "string",
  "playerMessage": "string",
  "dialogueHistory": [],
  "discoveredEvidenceIds": []
}
```

响应体：

```json
{
  "npcMessage": "string",
  "extractedEvidence": [],
  "newlyDiscoveredEvidenceIds": [],
  "contradictionHits": [],
  "suspectStateDelta": {},
  "updatedSuspectState": {}
}
```

要求：

- 玩家消息不能为空。
- 后端根据嫌疑人、证据、状态生成回复。
- MVP 阶段使用 Mock LLM。
- 不允许 NPC 直接泄露隐藏真相。
- 不允许 NPC 生成不存在的关键证据。
- 命中矛盾时必须更新嫌疑人状态。

---

## 提交最终报告

```http
POST /api/case/:caseId/final-report
```

请求体：

```json
{
  "culpritId": "string",
  "motive": "string",
  "method": "string",
  "timeline": "string",
  "keyEvidenceIds": [],
  "explanation": "string"
}
```

响应体：

```json
{
  "score": 0,
  "verdict": "string",
  "correctFields": [],
  "missedFields": [],
  "feedback": "string",
  "truthSummary": "optional string"
}
```

注意：

`truthSummary` 只能在提交最终报告之后返回。

---

## 最终评分规则

总分 100 分。

### 凶手正确：30 分

判断：

```text
culpritId === truth.culpritId
```

---

### 动机正确：20 分

玩家文本包含以下关键词之一或多个：

- 遗嘱
- 伪造
- 秘密
- 发现
- 威胁

或者玩家选择了关键证据：

```text
撕毁的遗嘱复印件
```

---

### 手段正确：20 分

玩家文本包含以下关键词之一或多个：

- 茶杯
- 毒
- 中毒
- 投毒
- 饮料

或者玩家选择了关键证据：

```text
茶杯毒物检测
```

---

### 时间线正确：15 分

玩家文本包含以下关键词之一或多个：

- 21:12
- 前厅
- 后台
- 离开
- 进入

或者玩家选择了关键证据：

```text
前厅监控录像
```

---

### 关键证据充足：15 分

至少选择以下 4 个关键证据中的 3 个：

- 前厅监控录像
- 茶杯毒物检测
- 撕毁的遗嘱复印件
- 陈岱证词

---

## 判定等级

```text
90-100：完美破案
70-89：成功破案，但仍有细节不完整
40-69：嫌疑成立，但证据链不足
0-39：错误指控或推理失败
```

---

## 错误处理

后端应处理：

- 案件不存在
- 地点不存在
- 嫌疑人不存在
- 玩家输入为空
- 重复调查
- 无效最终报告
- 服务内部错误

返回错误时，前端应能显示友好提示。
