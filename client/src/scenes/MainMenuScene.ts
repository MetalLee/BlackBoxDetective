import Phaser from "phaser";
import { clientApi } from "../api/clientApi";
import { gameState } from "../state/GameState";
import { createButton } from "../ui/button";

export class MainMenuScene extends Phaser.Scene {
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super("MainMenuScene");
  }

  create() {
    this.addRainBackdrop();
    this.add.text(640, 180, "黑箱侦探社", {
      fontFamily: "Microsoft YaHei, serif",
      fontSize: "56px",
      color: "#f4d28a"
    }).setOrigin(0.5);
    this.add.text(640, 250, "和嫌疑人对话，亲手找出真相", {
      fontFamily: "Microsoft YaHei, sans-serif",
      fontSize: "24px",
      color: "#d8deea"
    }).setOrigin(0.5);

    if (gameState.currentCase) {
      createButton(this, 520, 380, 220, 54, "继续案件", () => this.scene.start(gameState.finalResult ? "ResultScene" : "CaseScene"));
      createButton(this, 760, 380, 220, 54, "重新开始案件", () => void this.restartCase());
    } else {
      createButton(this, 640, 380, 220, 54, "开始案件", () => void this.startCase());
    }
    this.statusText = this.add.text(640, 460, "", {
      fontFamily: "Microsoft YaHei, sans-serif",
      fontSize: "18px",
      color: "#e7b566"
    }).setOrigin(0.5);
  }

  private async startCase() {
    this.statusText?.setText("正在封锁暮雨剧院...");
    try {
      const caseFile = await clientApi.startCase();
      gameState.startNewCase(caseFile);
      this.scene.start("CaseScene");
    } catch (error) {
      this.statusText?.setText(error instanceof Error ? error.message : "无法开始案件。");
    }
  }

  private async restartCase() {
    gameState.clear();
    await this.startCase();
  }

  private addRainBackdrop() {
    this.add.rectangle(640, 360, 1280, 720, 0x070b12);
    for (let i = 0; i < 120; i += 1) {
      const x = Phaser.Math.Between(0, 1280);
      const y = Phaser.Math.Between(0, 720);
      this.add.line(x, y, 0, 0, -8, 28, 0x6f829d, 0.24).setOrigin(0);
    }
    this.add.rectangle(640, 650, 1280, 140, 0x111824, 0.75);
  }
}
