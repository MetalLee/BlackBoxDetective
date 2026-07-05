import Phaser from "phaser";
import { clientApi } from "../api/clientApi";
import { gameState } from "../state/GameState";
import { addPanel, createButton, labelStyle } from "../ui/button";

export class FinalReportScene extends Phaser.Scene {
  private domElement?: Phaser.GameObjects.DOMElement;
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super("FinalReportScene");
  }

  create() {
    if (!gameState.currentCase) {
      this.scene.start("MainMenuScene");
      return;
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.domElement?.destroy());
    this.add.rectangle(640, 360, 1280, 720, 0x070b12);
    this.add.text(40, 28, "提交结案报告", { ...labelStyle, color: "#f4d28a", fontSize: "30px" });
    this.add.text(40, 75, "选择凶手，填写动机、手段、时间线，并勾选支撑证据。", {
      ...labelStyle,
      wordWrap: { width: 1000, useAdvancedWrap: true }
    });
    addPanel(this, 640, 370, 1120, 500);
    createButton(this, 1080, 48, 170, 42, "返回案件", () => this.scene.start("CaseScene"));
    this.statusText = this.add.text(80, 650, "", { ...labelStyle, color: "#e7b566", wordWrap: { width: 1080, useAdvancedWrap: true } });
    this.createForm();
  }

  private createForm() {
    const caseFile = gameState.currentCase;
    if (!caseFile) return;

    const evidence = gameState.discoveredEvidence();
    const reasoningEvidenceIds = new Set(Object.values(gameState.reasoningSlots).flat());
    const form = document.createElement("form");
    form.className = "report-form";
    const suspectOptions = caseFile.suspects.map((suspect) => `<option value="${suspect.id}">${suspect.name} / ${suspect.role}</option>`).join("");
    const evidenceChecks = evidence
      .map(
        (item) =>
          `<label><span><input type="checkbox" name="evidence" value="${item.id}" ${reasoningEvidenceIds.has(item.id) ? "checked" : ""} /> ${item.title}</span></label>`
      )
      .join("");
    form.innerHTML = `
      <label>真凶<select name="culpritId">${suspectOptions}</select></label>
      <label>动机<textarea name="motive" placeholder="例如：遗嘱、秘密、威胁..."></textarea></label>
      <label>作案手段<textarea name="method" placeholder="例如：茶杯、毒物..."></textarea></label>
      <label>关键时间线<textarea name="timeline" placeholder="例如：21:12 离开前厅进入后台..."></textarea></label>
      <div class="evidence-checks">${evidenceChecks || "尚未发现证据。"}</div>
      <label>推理说明<textarea name="explanation" placeholder="写下你的证据链。"></textarea></label>
      <div class="report-actions"><button type="submit">提交报告</button></div>
    `;

    const motive = form.elements.namedItem("motive") as HTMLTextAreaElement | null;
    const method = form.elements.namedItem("method") as HTMLTextAreaElement | null;
    const timeline = form.elements.namedItem("timeline") as HTMLTextAreaElement | null;
    const explanation = form.elements.namedItem("explanation") as HTMLTextAreaElement | null;
    motive!.value = this.slotTitles("motive").join("、");
    method!.value = this.slotTitles("method").join("、");
    timeline!.value = [...this.slotTitles("opportunity"), ...this.slotTitles("contradiction")].join("、");
    explanation!.value = this.reasoningSummary();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.submit(form);
    });

    this.domElement = this.add.dom(640, 390, form).setOrigin(0.5);
  }

  private async submit(form: HTMLFormElement) {
    const caseFile = gameState.currentCase;
    if (!caseFile) return;

    const formData = new FormData(form);
    const keyEvidenceIds = formData.getAll("evidence").map(String);
    this.statusText?.setText("正在提交结案报告...");
    try {
      const result = await clientApi.submitFinalReport(caseFile.id, {
        culpritId: String(formData.get("culpritId") ?? ""),
        motive: String(formData.get("motive") ?? ""),
        method: String(formData.get("method") ?? ""),
        timeline: String(formData.get("timeline") ?? ""),
        keyEvidenceIds,
        explanation: String(formData.get("explanation") ?? ""),
        hintCount: gameState.hintCount
      });
      gameState.finalResult = result;
      gameState.save();
      this.scene.start("ResultScene");
    } catch (error) {
      this.statusText?.setText(error instanceof Error ? error.message : "提交失败。");
    }
  }

  private slotTitles(slot: "motive" | "method" | "opportunity" | "contradiction" | "accusation") {
    const evidence = gameState.discoveredEvidence();
    return gameState.reasoningSlots[slot]
      .map((id) => evidence.find((item) => item.id === id)?.title)
      .filter((title): title is string => Boolean(title));
  }

  private reasoningSummary() {
    const lines = [
      ["动机", this.slotTitles("motive")],
      ["手段", this.slotTitles("method")],
      ["机会", this.slotTitles("opportunity")],
      ["矛盾", this.slotTitles("contradiction")],
      ["指控", this.slotTitles("accusation")]
    ]
      .filter(([, titles]) => Array.isArray(titles) && titles.length > 0)
      .map(([label, titles]) => `${label}：${(titles as string[]).join("、")}`);

    return lines.join("\n");
  }
}
