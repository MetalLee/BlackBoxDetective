import Phaser from "phaser";
import type { EvidenceSummary, EvidenceType, ReasoningSlot } from "@blackbox-detective/shared";
import { gameState } from "../state/GameState";
import { addPanel, createButton, labelStyle } from "../ui/button";

const typeLabels: Record<EvidenceType, string> = {
  physical: "物证",
  testimony: "证词",
  timeline: "时间线",
  relationship: "关系",
  contradiction: "矛盾"
};

const slotLabels: Record<ReasoningSlot, string> = {
  motive: "动机",
  method: "手段",
  opportunity: "机会",
  contradiction: "矛盾",
  accusation: "指控"
};

export class EvidenceBoardScene extends Phaser.Scene {
  private selectedEvidenceId: string | null = null;

  constructor() {
    super("EvidenceBoardScene");
  }

  create() {
    if (!gameState.currentCase) {
      this.scene.start("MainMenuScene");
      return;
    }

    this.render();
  }

  private render() {
    this.children.removeAll();
    const evidence = gameState.discoveredEvidence();
    if (!this.selectedEvidenceId && evidence[0]) {
      this.selectedEvidenceId = evidence[0].id;
    }

    this.add.rectangle(640, 360, 1280, 720, 0x070b12);
    this.add.text(40, 28, "证据板", { ...labelStyle, color: "#f4d28a", fontSize: "30px" });
    createButton(this, 1080, 48, 170, 42, "返回案件", () => this.scene.start("CaseScene"));

    addPanel(this, 375, 315, 670, 430);
    addPanel(this, 1035, 315, 390, 430);
    addPanel(this, 640, 640, 1160, 130, 0.72);

    this.renderEvidenceGroups(evidence);
    this.renderDetails(evidence.find((item) => item.id === this.selectedEvidenceId), evidence);
    this.renderReasoningSlots(evidence);
  }

  private renderEvidenceGroups(evidence: EvidenceSummary[]) {
    if (evidence.length === 0) {
      this.add.text(80, 125, "尚未发现证据。先返回案件调查地点或审问嫌疑人。", labelStyle);
      return;
    }

    let y = 98;
    (Object.keys(typeLabels) as EvidenceType[]).forEach((type) => {
      const group = evidence.filter((item) => item.type === type);
      if (group.length === 0) return;

      this.add.text(70, y, typeLabels[type], { ...labelStyle, color: "#e7b566", fontSize: "18px" });
      y += 26;
      group.forEach((item, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        this.addEvidenceCard(item, 72 + column * 210, y + row * 82);
      });
      y += Math.ceil(group.length / 3) * 82 + 10;
    });
  }

  private addEvidenceCard(evidence: EvidenceSummary, x: number, y: number) {
    const selected = evidence.id === this.selectedEvidenceId;
    const color = evidence.isKeyEvidence ? 0x3a2b15 : 0x172033;
    const rect = this.add
      .rectangle(x + 95, y + 30, 190, 64, selected ? 0x263650 : color, 0.98)
      .setStrokeStyle(1, selected ? 0xf4d28a : 0x6d5f3f)
      .setInteractive({ useHandCursor: true });

    this.add.text(x + 10, y + 6, evidence.title, {
      ...labelStyle,
      color: "#f7efe4",
      fontSize: "14px",
      wordWrap: { width: 170, useAdvancedWrap: true }
    });
    this.add.text(x + 10, y + 30, `${typeLabels[evidence.type]} / ${evidence.source ?? "未知来源"}`, {
      ...labelStyle,
      color: "#aeb8c8",
      fontSize: "11px",
      wordWrap: { width: 170, useAdvancedWrap: true }
    });
    this.add.text(x + 10, y + 47, evidence.discovered ? "已发现" : "未发现", {
      ...labelStyle,
      color: evidence.isKeyEvidence ? "#ffcf6b" : "#7fb2ff",
      fontSize: "11px"
    });
    rect.on("pointerup", () => {
      this.selectedEvidenceId = evidence.id;
      this.render();
    });
  }

  private renderDetails(selected: EvidenceSummary | undefined, evidence: EvidenceSummary[]) {
    this.add.text(860, 100, selected?.title ?? "选择一张证据卡", {
      ...labelStyle,
      color: "#f4d28a",
      fontSize: "20px",
      wordWrap: { width: 330, useAdvancedWrap: true }
    });

    if (!selected) {
      this.add.text(860, 150, "点击左侧证据可查看详情，并加入底部推理链槽位。", {
        ...labelStyle,
        fontSize: "15px",
        wordWrap: { width: 330, useAdvancedWrap: true }
      });
      return;
    }

    const detailText = [
      `完整描述：${selected.description ?? "暂无描述。"}`,
      `相关人物：${this.relatedPeople(selected) || "未知"}`,
      `相关地点：${this.relatedLocations(selected) || "未知"}`,
      `标签：${selected.tags?.join("、") || "无"}`,
      `可能关联：${this.relatedEvidence(selected, evidence) || "暂无"}`
    ].join("\n\n");

    this.add.text(860, 145, detailText, {
      ...labelStyle,
      fontSize: "14px",
      wordWrap: { width: 330, useAdvancedWrap: true },
      lineSpacing: 4
    });
  }

  private renderReasoningSlots(evidence: EvidenceSummary[]) {
    this.add.text(80, 585, "我的推理链", { ...labelStyle, color: "#e7b566", fontSize: "19px" });
    this.add.text(200, 590, "先点击证据卡，再点击槽位加入。", { ...labelStyle, color: "#aeb8c8", fontSize: "13px" });

    const slots = Object.keys(slotLabels) as ReasoningSlot[];
    slots.forEach((slot, index) => {
      const x = 130 + index * 225;
      const ids = gameState.reasoningSlots[slot];
      const titles = ids
        .map((id) => evidence.find((item) => item.id === id)?.title)
        .filter((title): title is string => Boolean(title));
      const rect = this.add
        .rectangle(x, 645, 190, 60, 0x121a27, 0.96)
        .setStrokeStyle(1, titles.length ? 0xb89045 : 0x344258)
        .setInteractive({ useHandCursor: true });

      this.add.text(x - 82, 621, slotLabels[slot], { ...labelStyle, color: "#f4d28a", fontSize: "15px" });
      this.add.text(x - 82, 642, titles.join("、") || "未选择", {
        ...labelStyle,
        fontSize: "12px",
        wordWrap: { width: 164, useAdvancedWrap: true }
      });
      rect.on("pointerup", () => {
        if (this.selectedEvidenceId) {
          gameState.addEvidenceToSlot(slot, this.selectedEvidenceId);
          this.render();
        }
      });

      if (index < slots.length - 1) {
        this.add.line(x + 102, 645, 0, 0, 34, 0, 0x6d5f3f, 0.9).setOrigin(0);
        this.add.text(x + 134, 636, ">", { ...labelStyle, color: "#6d5f3f", fontSize: "16px" });
      }
    });
  }

  private relatedPeople(evidence: EvidenceSummary) {
    const suspects = gameState.currentCase?.suspects ?? [];
    return (evidence.relatedSuspectIds ?? [])
      .map((id) => suspects.find((suspect) => suspect.id === id)?.name)
      .filter((name): name is string => Boolean(name))
      .join("、");
  }

  private relatedLocations(evidence: EvidenceSummary) {
    const locations = gameState.currentCase?.locations ?? [];
    return locations
      .filter((location) => location.evidenceIds.includes(evidence.id))
      .map((location) => location.name)
      .join("、");
  }

  private relatedEvidence(selected: EvidenceSummary, evidence: EvidenceSummary[]) {
    const selectedTags = new Set(selected.tags ?? []);
    const selectedSuspects = new Set(selected.relatedSuspectIds ?? []);
    return evidence
      .filter((item) => item.id !== selected.id)
      .filter((item) =>
        (item.tags ?? []).some((tag) => selectedTags.has(tag)) ||
        (item.relatedSuspectIds ?? []).some((id) => selectedSuspects.has(id))
      )
      .slice(0, 3)
      .map((item) => item.title)
      .join("、");
  }
}
