import Phaser from "phaser";

export const createButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  onClick: () => void
) => {
  const container = scene.add.container(x, y);
  const rect = scene.add
    .rectangle(0, 0, width, height, 0x172033, 0.96)
    .setStrokeStyle(1, 0xb89045, 0.9)
    .setInteractive({ useHandCursor: true });
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: "Microsoft YaHei, sans-serif",
      fontSize: "18px",
      color: "#f5ead7"
    })
    .setOrigin(0.5);

  rect.on("pointerover", () => rect.setFillStyle(0x25314a, 1));
  rect.on("pointerout", () => rect.setFillStyle(0x172033, 0.96));
  rect.on("pointerup", onClick);
  container.add([rect, text]);
  return container;
};

export const addPanel = (scene: Phaser.Scene, x: number, y: number, width: number, height: number, alpha = 0.78) =>
  scene.add.rectangle(x, y, width, height, 0x101722, alpha).setStrokeStyle(1, 0x344258, 0.9);

export const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Microsoft YaHei, sans-serif",
  fontSize: "17px",
  color: "#d8deea",
  wordWrap: { width: 320, useAdvancedWrap: true }
};
