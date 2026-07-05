import Phaser from "phaser";
import type { DialogueMessage, SuspectState } from "@blackbox-detective/shared";
import { clientApi } from "../api/clientApi";
import { gameState } from "../state/GameState";
import { addPanel, createButton, labelStyle } from "../ui/button";

export class InterrogationScene extends Phaser.Scene {
  private feedbackText?: Phaser.GameObjects.Text;
  private domElement?: Phaser.GameObjects.DOMElement;
  private stateText?: Phaser.GameObjects.Text;

  constructor() {
    super("InterrogationScene");
  }

  create() {
    if (!gameState.currentCase || !gameState.selectedSuspectId) {
      this.scene.start("CaseScene");
      return;
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.domElement?.destroy());
    this.render();
  }

  private render() {
    this.children.removeAll();
    const caseFile = gameState.currentCase;
    const suspect = caseFile?.suspects.find((item) => item.id === gameState.selectedSuspectId);
    if (!caseFile || !suspect) return;

    this.add.rectangle(640, 360, 1280, 720, 0x070b12);
    addPanel(this, 190, 330, 300, 530);
    addPanel(this, 665, 330, 610, 530);
    addPanel(this, 1090, 330, 250, 530);

    this.add.text(55, 90, `${suspect.name}`, { ...labelStyle, color: "#f4d28a", fontSize: "28px" });
    this.add.text(55, 135, suspect.role, { ...labelStyle, fontSize: "18px" });
    this.add.text(55, 175, suspect.publicProfile, { ...labelStyle, wordWrap: { width: 250, useAdvancedWrap: true } });
    this.stateText = this.add.text(
      55,
      290,
      `信任 ${suspect.currentState.trust}\n压力 ${suspect.currentState.pressure}\n防备 ${suspect.currentState.defense}`,
      { ...labelStyle, color: "#e7b566", lineSpacing: 12 }
    );

    this.add.text(380, 82, "审讯记录", { ...labelStyle, color: "#f4d28a", fontSize: "22px" });
    const history = gameState.dialogueFor(suspect.id).slice(-8);
    const dialogueText = history.length
      ? history.map((message) => `${message.speaker === "player" ? "侦探" : message.speaker === "npc" ? suspect.name : "系统"}：${message.text}`).join("\n\n")
      : "输入问题开始审讯。";
    this.add.text(380, 125, dialogueText, {
      ...labelStyle,
      fontSize: "16px",
      wordWrap: { width: 540, useAdvancedWrap: true }
    });

    this.add.text(990, 90, "反馈", { ...labelStyle, color: "#f4d28a", fontSize: "22px" });
    this.feedbackText = this.add.text(990, 130, "新证据、矛盾命中和状态变化会显示在这里。", {
      ...labelStyle,
      fontSize: "15px",
      wordWrap: { width: 205, useAdvancedWrap: true }
    });

    createButton(this, 170, 650, 170, 44, "返回案件", () => this.scene.start("CaseScene"));
    createButton(this, 1070, 650, 170, 44, "证据板", () => this.scene.start("EvidenceBoardScene"));
    this.createInput(suspect.id);
  }

  private createInput(suspectId: string) {
    this.domElement?.destroy();
    const form = document.createElement("form");
    form.className = "interrogation-form";
    form.innerHTML = `<input name="question" autocomplete="off" placeholder="输入你的问题，例如：21:12 你为什么离开前厅？" /><button type="submit">发送</button>`;
    this.domElement = this.add.dom(640, 608, form).setOrigin(0.5);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.elements.namedItem("question") as HTMLInputElement | null;
      const value = input?.value.trim() ?? "";
      if (!value) {
        this.feedbackText?.setText("问题不能为空。");
        return;
      }
      if (input) input.value = "";
      void this.sendQuestion(suspectId, value);
    });
  }

  private async sendQuestion(suspectId: string, value: string) {
    const caseFile = gameState.currentCase;
    if (!caseFile) return;
    const beforeState = caseFile.suspects.find((suspect) => suspect.id === suspectId)?.currentState;

    this.feedbackText?.setText("嫌疑人正在回答...");
    const playerMessage: DialogueMessage = {
      speaker: "player",
      speakerId: "detective",
      text: value,
      timestamp: new Date().toISOString(),
      extractedEvidenceIds: [],
      contradictionHits: []
    };

    try {
      const response = await clientApi.interrogate({
        caseId: caseFile.id,
        suspectId,
        playerMessage: value,
        dialogueHistory: gameState.dialogueFor(suspectId),
        discoveredEvidenceIds: gameState.discoveredEvidence().map((evidence) => evidence.id)
      });
      const npcMessage: DialogueMessage = {
        speaker: "npc",
        speakerId: suspectId,
        text: response.npcMessage,
        timestamp: new Date().toISOString(),
        extractedEvidenceIds: response.newlyDiscoveredEvidenceIds,
        contradictionHits: response.contradictionHits
      };
      gameState.setCase(response.caseFile);
      gameState.appendDialogue(suspectId, [playerMessage]);
      this.render();
      this.animateStateChange(beforeState, response.updatedSuspectState);
      if (response.extractedEvidence.length) {
        this.showEvidencePulse(response.extractedEvidence.map((evidence) => evidence.title).join("、"));
      }
      if (response.contradictionHits.length) {
        this.flashContradiction(response.contradictionHits.join("、"));
      }
      this.typeNpcReply(response.npcMessage, () => {
        gameState.appendDialogue(suspectId, [npcMessage]);
        this.render();
        this.feedbackText?.setColor(response.contradictionHits.length ? "#ffcf6b" : "#d8deea");
        this.feedbackText?.setText(this.buildFeedbackText(response));
      });
    } catch (error) {
      this.feedbackText?.setText(error instanceof Error ? error.message : "审讯失败。");
    }
  }

  private typeNpcReply(text: string, onComplete: () => void) {
    const typing = this.add.text(380, 515, "", {
      ...labelStyle,
      fontSize: "16px",
      color: "#f7efe4",
      wordWrap: { width: 540, useAdvancedWrap: true }
    });
    let index = 0;
    const timer = this.time.addEvent({
      delay: 18,
      loop: true,
      callback: () => {
        index += 1;
        typing.setText(`嫌疑人：${text.slice(0, index)}`);
        if (index >= text.length) {
          timer.remove();
          this.time.delayedCall(240, onComplete);
        }
      }
    });
  }

  private showEvidencePulse(title: string) {
    const card = this.add.rectangle(1090, 430, 210, 72, 0x4a3515, 0.94).setStrokeStyle(2, 0xffcf6b).setDepth(10);
    const text = this.add.text(990, 405, `新证据\n${title}`, {
      ...labelStyle,
      fontSize: "14px",
      color: "#ffcf6b",
      wordWrap: { width: 190, useAdvancedWrap: true }
    }).setDepth(11);
    this.tweens.add({
      targets: [card, text],
      alpha: 0.25,
      yoyo: true,
      repeat: 3,
      duration: 180,
      onComplete: () => {
        card.destroy();
        text.destroy();
      }
    });
  }

  private flashContradiction(label: string) {
    const flash = this.add.rectangle(640, 360, 1280, 720, 0x7a1f1f, 0.28).setDepth(20);
    const banner = this.add.text(640, 260, `矛盾命中：${label}`, {
      ...labelStyle,
      fontSize: "34px",
      color: "#ffcf6b"
    }).setOrigin(0.5).setDepth(21);
    this.tweens.add({
      targets: [flash, banner],
      alpha: 0,
      duration: 700,
      onComplete: () => {
        flash.destroy();
        banner.destroy();
      }
    });
  }

  private animateStateChange(before: SuspectState | undefined, after: SuspectState) {
    if (!before || !this.stateText) return;

    const changed = before.trust !== after.trust || before.pressure !== after.pressure || before.defense !== after.defense;
    if (!changed) return;

    this.tweens.add({
      targets: this.stateText,
      scaleX: 1.08,
      scaleY: 1.08,
      color: "#ffcf6b",
      yoyo: true,
      repeat: 1,
      duration: 180
    });
  }

  private buildFeedbackText(response: {
    extractedEvidence: { title: string }[];
    contradictionHits: string[];
    suspectStateDelta: Partial<SuspectState>;
  }) {
    const evidenceLine = response.extractedEvidence.length
      ? `新证据：${response.extractedEvidence.map((evidence) => evidence.title).join("、")}`
      : "新证据：无";
    const contradictionLine = response.contradictionHits.length
      ? `矛盾命中：${response.contradictionHits.join("、")}`
      : "矛盾命中：无";
    const deltaLine = `状态变化：${this.formatDelta("信任", response.suspectStateDelta.trust)}  ${this.formatDelta("压力", response.suspectStateDelta.pressure)}  ${this.formatDelta("防备", response.suspectStateDelta.defense)}`;

    return `${evidenceLine}\n${contradictionLine}\n${deltaLine}`;
  }

  private formatDelta(label: string, value: number | undefined) {
    const delta = value ?? 0;
    const sign = delta > 0 ? "+" : "";
    return `${label} ${sign}${delta}`;
  }
}
