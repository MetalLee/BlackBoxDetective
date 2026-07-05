# 05 前端交互规范

## 前端整体目标

前端使用 Phaser 实现一个可玩的 Web 游戏界面。

重点是清晰的侦探游戏交互，而不是复杂美术。

---

## 视觉风格

整体风格：

- 雨夜
- 剧院
- 侦探社
- 悬疑
- 暗色
- 克制

推荐主色：

- 黑色
- 深蓝
- 暗金
- 灰白

避免：

- 高饱和卡通色
- 复杂背景
- 过度装饰
- 文字难以阅读
- UI 过度拥挤

---

## Phaser 场景

必须实现以下 Scene：

1. BootScene
2. MainMenuScene
3. CaseScene
4. InterrogationScene
5. EvidenceBoardScene
6. FinalReportScene
7. ResultScene

---

## 场景流转

```text
BootScene
↓
MainMenuScene
↓
CaseScene
↓
InterrogationScene
EvidenceBoardScene
FinalReportScene
↓
ResultScene
```

---

## MainMenuScene

内容：

- 游戏标题：《黑箱侦探社》
- 副标题：和嫌疑人对话，亲手找出真相
- 按钮：开始案件

点击“开始案件”后：

1. 调用 `POST /api/case/start`
2. 保存案件到 GameState
3. 进入 CaseScene

---

## CaseScene

布局建议：

- 顶部：案件标题、案情摘要
- 左侧：地点列表
- 中间：地点描述和调查结果
- 右侧：嫌疑人列表
- 底部：功能按钮

功能按钮：

- 调查当前地点
- 审问当前嫌疑人
- 打开证据板
- 提交结案

地点点击后显示：

- 地点名
- 地点描述
- 相关嫌疑人
- 已发现证据
- 可调查对象

---

## InterrogationScene

布局建议：

- 左侧：嫌疑人信息
- 中间：对话记录
- 底部：文本输入框和发送按钮
- 右侧：新证据提示和状态变化

嫌疑人信息包括：

- 姓名
- 身份
- 简短描述
- 信任值
- 压力值
- 防备值

输入要求：

- 玩家可以自由输入中文问题。
- 输入为空时不能发送。
- 支持回车发送。
- 发送后清空输入框。
- 请求失败时显示友好错误。

注意：

如果使用 Phaser DOM Element 或 HTML Overlay 实现输入框，离开 Scene 时必须销毁 DOM 节点，避免重复创建。

---

## EvidenceBoardScene

证据板应展示所有已发现证据。

分组：

- 物证
- 证词
- 时间线
- 关系
- 矛盾

每张证据卡显示：

- 标题
- 类型
- 来源
- 简短描述

点击证据卡显示详情：

- 完整描述
- 相关人物
- 标签
- 可能关联证据

---

## 推理链区域

证据板底部增加“我的推理链”。

槽位：

1. 动机
2. 手段
3. 机会
4. 矛盾
5. 指控

玩家可以点击证据卡，然后选择加入某个槽位。

不要求复杂拖拽，点击选择即可。

推理链需要保存到 GameState，并在最终报告界面中作为默认提示。

---

## FinalReportScene

最终报告界面包含：

- 选择真凶
- 填写动机
- 填写作案手段
- 填写关键时间线
- 勾选关键证据
- 填写推理说明
- 提交按钮

提交后调用：

```text
POST /api/case/:caseId/final-report
```

成功后进入 ResultScene。

---

## ResultScene

结果界面显示：

- 总分
- 判定结果
- 正确项
- 遗漏项
- 系统反馈
- 结案后真相摘要
- 重新开始按钮

重新开始应清空当前存档并重新调用开始案件。

---

## GameState

前端 GameState 至少记录：

- currentCase
- selectedLocationId
- selectedSuspectId
- discoveredEvidenceIds
- dialogueHistoryBySuspect
- reasoningSlots
- finalResult

可以使用 localStorage 做刷新恢复，但后端仍应是案件逻辑的权威来源。
