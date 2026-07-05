# 02 领域模型

## 核心概念

游戏必须围绕以下领域对象构建：

- CaseFile：案件
- Truth / Case Bible：隐藏真相
- Suspect：嫌疑人
- SuspectState：嫌疑人状态
- Location：调查地点
- Evidence：证据
- Contradiction：矛盾
- DialogueMessage：对话消息
- FinalReport：最终报告
- CaseResult：结案结果

---

## CaseFile

代表一个可游玩的案件。

字段建议：

```ts
interface CaseFile {
  id: string;
  title: string;
  synopsis: string;
  victim: string;
  suspects: Suspect[];
  locations: Location[];
  evidence: Evidence[];
  contradictions: Contradiction[];
  startedAt: string;
}
```

注意：

前端可见的 CaseFile 不能直接暴露隐藏真相。

---

## Truth / Case Bible

后端内部隐藏真相。

字段建议：

```ts
interface Truth {
  culpritId: string;
  motive: string;
  method: string;
  timeline: string;
  fakeAlibi: string;
  keyEvidenceIds: string[];
}
```

要求：

- 只能保存在后端。
- 结案前不能直接返回给前端。
- 用于约束 NPC 行为和最终判定。
- 一旦案件开始，不应在对话过程中改变。

---

## Suspect

嫌疑人。

字段建议：

```ts
interface Suspect {
  id: string;
  name: string;
  role: string;
  age: number;
  personality: string;
  publicProfile: string;
  hiddenSecret: string;
  isCulprit: boolean;
  knowledge: string[];
  lies: string[];
  revealRules: RevealRule[];
  currentState: SuspectState;
}
```

注意：

- `isCulprit` 不应在结案前暴露给前端。
- 前端应只看到玩家可见信息。
- 隐藏秘密不应直接给前端。

---

## SuspectState

嫌疑人当前状态。

字段建议：

```ts
interface SuspectState {
  trust: number;
  pressure: number;
  defense: number;
  unlockedEvidenceIds: string[];
  discoveredContradictionIds: string[];
}
```

状态含义：

- trust：信任值，影响证人是否愿意透露信息。
- pressure：压力值，影响嫌疑人是否露出破绽。
- defense：防备值，影响嫌疑人是否回避问题。
- unlockedEvidenceIds：该嫌疑人相关已解锁证据。
- discoveredContradictionIds：该嫌疑人已命中的矛盾。

---

## Location

调查地点。

字段建议：

```ts
interface Location {
  id: string;
  name: string;
  description: string;
  evidenceIds: string[];
  suspectIds: string[];
}
```

---

## Evidence

证据。

字段建议：

```ts
interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  source: string;
  relatedSuspectIds: string[];
  tags: string[];
  isKeyEvidence: boolean;
  discovered: boolean;
}
```

允许的证据类型：

```ts
type EvidenceType =
  | "physical"
  | "testimony"
  | "timeline"
  | "relationship"
  | "contradiction";
```

中文含义：

- physical：物证
- testimony：证词
- timeline：时间线
- relationship：关系证据
- contradiction：矛盾证据

---

## Contradiction

矛盾。

字段建议：

```ts
interface Contradiction {
  id: string;
  title: string;
  claimEvidenceId: string;
  counterEvidenceId: string;
  suspectId: string;
  description: string;
  unlockedEvidenceIds: string[];
}
```

作用：

用于判断玩家是否抓住某个嫌疑人的证词漏洞。

---

## DialogueMessage

对话消息。

字段建议：

```ts
interface DialogueMessage {
  speaker: "player" | "npc" | "system";
  speakerId?: string;
  text: string;
  timestamp: string;
  extractedEvidenceIds: string[];
  contradictionHits: string[];
}
```

---

## FinalReport

玩家提交的最终结案报告。

字段建议：

```ts
interface FinalReport {
  culpritId: string;
  motive: string;
  method: string;
  timeline: string;
  keyEvidenceIds: string[];
  explanation: string;
}
```

---

## CaseResult

结案结果。

字段建议：

```ts
interface CaseResult {
  score: number;
  verdict: string;
  correctFields: string[];
  missedFields: string[];
  feedback: string;
}
```

结案后可以额外返回真相摘要，但只能在提交最终报告之后显示。
