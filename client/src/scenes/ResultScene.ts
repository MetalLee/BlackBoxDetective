import Phaser from "phaser";
import { clientApi } from "../api/clientApi";
import { gameState } from "../state/GameState";
import { addPanel, createButton, labelStyle } from "../ui/button";

export class ResultScene extends Phaser.Scene {
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super("ResultScene");
  }

  create() {
    const result = gameState.finalResult;
    if (!result) {
      this.scene.start("CaseScene");
      return;
    }

    this.add.rectangle(640, 360, 1280, 720, 0x070b12);
    addPanel(this, 640, 360, 900, 520);
    this.add.text(250, 120, "结案结果", { ...labelStyle, color: "#f4d28a", fontSize: "34px" });
    this.add.text(250, 185, `总分：${result.score}`, { ...labelStyle, color: "#e7b566", fontSize: "28px" });
    this.add.text(250, 235, result.verdict, { ...labelStyle, fontSize: "22px", color: "#f7efe4" });
    this.add.text(250, 290, `正确项：${result.correctFields.join("、") || "无"}`, {
      ...labelStyle,
      wordWrap: { width: 760, useAdvancedWrap: true }
    });
    this.add.text(250, 335, `遗漏项：${result.missedFields.join("、") || "无"}`, {
      ...labelStyle,
      wordWrap: { width: 760, useAdvancedWrap: true }
    });
    this.add.text(250, 385, `${result.feedback}\n\n${result.truthSummary ?? ""}`, {
      ...labelStyle,
      wordWrap: { width: 760, useAdvancedWrap: true },
      lineSpacing: 8
    });
    createButton(this, 540, 590, 180, 46, "返回案件", () => this.scene.start("CaseScene"));
    createButton(this, 760, 590, 180, 46, "重新开始", () => void this.restart());
    this.statusText = this.add.text(460, 640, "", { ...labelStyle, color: "#e7b566", wordWrap: { width: 420, useAdvancedWrap: true } });
  }

  private async restart() {
    this.statusText?.setText("正在开启新案件...");
    try {
      gameState.clear();
      const caseFile = await clientApi.startCase();
      gameState.startNewCase(caseFile);
      this.scene.start("CaseScene");
    } catch (error) {
      this.statusText?.setText(error instanceof Error ? error.message : "重新开始失败。");
    }
  }
}
