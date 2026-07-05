import Phaser from "phaser";
import type { EvidenceSummary, Location } from "@blackbox-detective/shared";
import { clientApi } from "../api/clientApi";
import { gameState } from "../state/GameState";
import { addPanel, createButton, labelStyle } from "../ui/button";

const investigationObjectLabels: Record<string, string> = {
  front_hall_signup: "宾客签到表",
  front_hall_departure_clue: "签到台旁的离场记录",
  shen_qiao_alibi_claim: "沈乔的不在场证明",
  victim_teacup: "死者茶杯",
  poisoned_teacup_report: "茶杯毒物检测结果",
  torn_will_copy: "沙发缝里的碎纸",
  side_door_footprint: "通往后台的侧门脚印",
  side_door_heelprint: "细高跟鞋跟痕迹",
  bloody_prop: "带血道具",
  front_hall_cctv: "前厅监控录像"
};

export class CaseScene extends Phaser.Scene {
  private feedbackText?: Phaser.GameObjects.Text;
  private narrativeText = "选择地点后点击调查。调查结果会记录在这里。";
  private lastNewEvidenceIds: string[] = [];
  private lastHint?: string;

  constructor() {
    super("CaseScene");
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
    const caseFile = gameState.currentCase;
    if (!caseFile) return;

    this.add.rectangle(640, 360, 1280, 720, 0x070b12);
    this.add.text(40, 24, caseFile.title, {
      fontFamily: "Microsoft YaHei, sans-serif",
      fontSize: "30px",
      color: "#f4d28a"
    });
    this.add.text(40, 66, caseFile.synopsis, {
      ...labelStyle,
      fontSize: "16px",
      wordWrap: { width: 1120, useAdvancedWrap: true }
    });
    this.add.text(40, 100, `已用提示：${gameState.hintCount}/3`, { ...labelStyle, fontSize: "14px", color: "#aeb8c8" });
    createButton(this, 1010, 42, 150, 38, "获得提示", () => this.showHint());
    createButton(this, 1170, 42, 150, 38, "重新开始", () => void this.restartCase());

    addPanel(this, 190, 360, 300, 470);
    this.add.text(60, 145, "调查地点", { ...labelStyle, color: "#f4d28a", fontSize: "20px" });
    caseFile.locations.forEach((location, index) => {
      const selected = location.id === gameState.selectedLocationId;
      const y = 190 + index * 58;
      const rect = this.add
        .rectangle(190, y, 250, 42, selected ? 0x263650 : 0x121a27, 0.95)
        .setStrokeStyle(1, selected ? 0xf4d28a : 0x344258)
        .setInteractive({ useHandCursor: true });
      this.add.text(80, y - 11, location.name, { ...labelStyle, fontSize: "17px" });
      rect.on("pointerup", () => {
        gameState.selectedLocationId = location.id;
        gameState.save();
        this.render();
      });
    });

    addPanel(this, 640, 360, 500, 470);
    const selectedLocation = caseFile.locations.find((location) => location.id === gameState.selectedLocationId) ?? caseFile.locations[0];
    if (selectedLocation) {
      this.add.text(420, 145, selectedLocation.name, { ...labelStyle, color: "#f4d28a", fontSize: "22px" });
      this.add.text(420, 190, selectedLocation.description, {
        ...labelStyle,
        wordWrap: { width: 420, useAdvancedWrap: true }
      });

      this.add.text(420, 255, "可调查对象", { ...labelStyle, color: "#e7b566", fontSize: "18px" });
      this.add.text(420, 285, this.investigationObjectsText(selectedLocation), {
        ...labelStyle,
        fontSize: "14px",
        wordWrap: { width: 420, useAdvancedWrap: true }
      });

      this.add.text(420, 355, "相关嫌疑人", { ...labelStyle, color: "#e7b566", fontSize: "18px" });
      this.add.text(420, 385, this.relatedSuspectsText(selectedLocation), {
        ...labelStyle,
        fontSize: "14px",
        wordWrap: { width: 420, useAdvancedWrap: true }
      });

      const found = gameState
        .discoveredEvidence()
        .filter((evidence) => selectedLocation.evidenceIds.includes(evidence.id));
      this.add.text(420, 445, "已发现证据", { ...labelStyle, color: "#e7b566", fontSize: "18px" });
      this.add.text(420, 475, found.length ? found.map((evidence) => `- ${evidence.title}`).join("\n") : "尚未发现。", {
        ...labelStyle,
        fontSize: "14px",
        wordWrap: { width: 420, useAdvancedWrap: true }
      });

      this.renderNarrativePanel(found);
    }

    addPanel(this, 1080, 360, 300, 470);
    this.add.text(960, 145, "嫌疑人", { ...labelStyle, color: "#f4d28a", fontSize: "20px" });
    caseFile.suspects.forEach((suspect, index) => {
      const selected = suspect.id === gameState.selectedSuspectId;
      const y = 190 + index * 72;
      const rect = this.add
        .rectangle(1080, y, 245, 54, selected ? 0x263650 : 0x121a27, 0.95)
        .setStrokeStyle(1, selected ? 0xf4d28a : 0x344258)
        .setInteractive({ useHandCursor: true });
      this.add.text(980, y - 17, `${suspect.name} / ${suspect.role}`, { ...labelStyle, fontSize: "16px" });
      this.add.text(980, y + 7, `信任 ${suspect.currentState.trust}  压力 ${suspect.currentState.pressure}  防备 ${suspect.currentState.defense}`, {
        ...labelStyle,
        fontSize: "13px",
        color: "#aeb8c8"
      });
      rect.on("pointerup", () => {
        gameState.selectedSuspectId = suspect.id;
        gameState.save();
        this.render();
      });
    });

    createButton(this, 280, 650, 190, 46, "调查当前地点", () => void this.investigate());
    createButton(this, 500, 650, 190, 46, "审问嫌疑人", () => this.scene.start("InterrogationScene"));
    createButton(this, 720, 650, 170, 46, "证据板", () => this.scene.start("EvidenceBoardScene"));
    createButton(this, 920, 650, 170, 46, "提交结案", () => this.scene.start("FinalReportScene"));
    createButton(this, 1120, 650, 210, 46, "审问相关嫌疑人", () => this.interrogateRelatedSuspect());

    this.feedbackText = this.add.text(40, 610, "", {
      ...labelStyle,
      color: "#e7b566",
      wordWrap: { width: 1120, useAdvancedWrap: true }
    });

    if (!gameState.tutorialSeen) {
      this.showTutorial();
    }
  }

  private async investigate() {
    const caseFile = gameState.currentCase;
    const locationId = gameState.selectedLocationId;
    if (!caseFile || !locationId) return;

    this.feedbackText?.setText("正在调查...");
    try {
      const response = await clientApi.investigate(caseFile.id, { locationId });
      gameState.setCase(response.caseFile);
      this.narrativeText = response.narrativeText;
      this.lastNewEvidenceIds = response.newlyDiscoveredEvidenceIds;
      this.lastHint = response.hint;
      this.render();
      this.feedbackText?.setText(response.hint ?? response.narrativeText);
    } catch (error) {
      this.feedbackText?.setText(error instanceof Error ? error.message : "调查失败。");
    }
  }

  private showTutorial() {
    const overlay = this.add.container(640, 360).setDepth(30);
    const shade = this.add.rectangle(0, 0, 1280, 720, 0x02040a, 0.72).setInteractive();
    const panel = addPanel(this, 0, 0, 620, 360, 0.96);
    const title = this.add.text(-270, -145, "侦探行动简报", { ...labelStyle, color: "#f4d28a", fontSize: "26px" });
    const body = this.add.text(
      -270,
      -92,
      [
        "1. 调查地点可以获得物证。",
        "2. 审问嫌疑人可以获得证词。",
        "3. 发现矛盾后，嫌疑人的压力和防备会变化。",
        "4. 证据板可以整理你的推理链。",
        "5. 最终需要提交完整结案报告。"
      ].join("\n"),
      { ...labelStyle, fontSize: "18px", lineSpacing: 10, wordWrap: { width: 540, useAdvancedWrap: true } }
    );
    const close = createButton(this, 0, 130, 180, 42, "开始调查", () => {
      gameState.markTutorialSeen();
      overlay.destroy();
    });
    overlay.add([shade, panel, title, body, close]);
  }

  private showHint() {
    const hint = gameState.requestHint();
    this.render();
    this.feedbackText?.setColor("#ffcf6b");
    this.feedbackText?.setText(`${hint}\n提示会降低最终评价，但不会影响通关。`);
  }

  private async restartCase() {
    this.feedbackText?.setText("正在重新开启案件...");
    try {
      gameState.clear();
      const caseFile = await clientApi.startCase();
      gameState.startNewCase(caseFile);
      this.narrativeText = "选择地点后点击调查。调查结果会记录在这里。";
      this.lastNewEvidenceIds = [];
      this.lastHint = undefined;
      this.scene.start("CaseScene");
    } catch (error) {
      this.feedbackText?.setText(error instanceof Error ? error.message : "重新开始失败。");
    }
  }

  private investigationObjectsText(location: Location) {
    return location.evidenceIds.map((id) => `- ${investigationObjectLabels[id] ?? "可疑痕迹"}`).join("\n");
  }

  private relatedSuspectsText(location: Location) {
    const caseFile = gameState.currentCase;
    if (!caseFile) return "无";

    return location.suspectIds
      .map((id) => caseFile.suspects.find((suspect) => suspect.id === id)?.name)
      .filter((name): name is string => Boolean(name))
      .join("、") || "无";
  }

  private renderNarrativePanel(found: EvidenceSummary[]) {
    addPanel(this, 640, 570, 500, 105, 0.68);
    const hintPrefix = this.lastHint ? `${this.lastHint}\n` : "";
    this.add.text(420, 522, `${hintPrefix}${this.summarizeNarrative(this.narrativeText)}`, {
      ...labelStyle,
      fontSize: "14px",
      color: this.lastHint?.includes("关键证据") ? "#ffcf6b" : "#d8deea",
      wordWrap: { width: 420, useAdvancedWrap: true }
    });

    const newEvidence = found.filter((evidence) => this.lastNewEvidenceIds.includes(evidence.id));
    newEvidence.slice(0, 2).forEach((evidence, index) => {
      const x = 490 + index * 190;
      const card = this.add.rectangle(x, 595, 170, 42, evidence.isKeyEvidence ? 0x4a3515 : 0x172033, 0.98).setStrokeStyle(1, 0xf4d28a);
      this.add.text(x - 76, 582, evidence.isKeyEvidence ? "关键证据" : "新证据", {
        ...labelStyle,
        fontSize: "12px",
        color: "#ffcf6b"
      });
      this.add.text(x - 76, 599, evidence.title, {
        ...labelStyle,
        fontSize: "13px",
        color: "#f7efe4",
        wordWrap: { width: 150, useAdvancedWrap: true }
      });
      this.tweens.add({
        targets: card,
        scaleX: 1.06,
        scaleY: 1.12,
        alpha: 0.65,
        yoyo: true,
        repeat: 2,
        duration: 180
      });
    });
  }

  private summarizeNarrative(text: string) {
    return text.length > 88 ? `${text.slice(0, 88)}...` : text;
  }

  private interrogateRelatedSuspect() {
    const caseFile = gameState.currentCase;
    const location = caseFile?.locations.find((item) => item.id === gameState.selectedLocationId);
    const suspectId = location?.suspectIds[0] ?? gameState.selectedSuspectId;
    if (suspectId) {
      gameState.selectedSuspectId = suspectId;
      gameState.save();
      this.scene.start("InterrogationScene");
    }
  }
}
