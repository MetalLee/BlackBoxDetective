import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { CaseScene } from "./scenes/CaseScene";
import { EvidenceBoardScene } from "./scenes/EvidenceBoardScene";
import { FinalReportScene } from "./scenes/FinalReportScene";
import { InterrogationScene } from "./scenes/InterrogationScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { ResultScene } from "./scenes/ResultScene";

export const createGame = () =>
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-root",
    width: 1280,
    height: 720,
    backgroundColor: "#0a0e14",
    dom: {
      createContainer: true
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MainMenuScene, CaseScene, InterrogationScene, EvidenceBoardScene, FinalReportScene, ResultScene]
  });
