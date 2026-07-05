import { describe, expect, it } from "vitest";
import { CaseService } from "../src/services/CaseService";
import { MockCaseService } from "../src/services/MockCaseService";

describe("CaseService", () => {
  it("starts a case without exposing hidden truth", () => {
    const service = new CaseService();
    const caseFile = service.startCase();
    const serialized = JSON.stringify(caseFile);

    expect(caseFile.title).toBe("雨夜剧院谋杀案");
    expect(serialized).not.toContain("culpritId");
    expect(serialized).not.toContain("isCulprit");
    expect(serialized).not.toContain("真凶");
  });

  it("discovers location evidence once", () => {
    const service = new CaseService();
    const caseFile = service.startCase();

    const first = service.investigate(caseFile.id, { locationId: "backstage_lounge" });
    const second = service.investigate(caseFile.id, { locationId: "backstage_lounge" });

    expect(first.newlyDiscoveredEvidenceIds).toContain("poisoned_teacup_report");
    expect(second.newlyDiscoveredEvidenceIds).toEqual([]);
  });

  it("discovers the designed evidence set for each investigation location", () => {
    const service = new CaseService();
    const caseFile = service.startCase();

    const frontHall = service.investigate(caseFile.id, { locationId: "front_hall" });
    const backstage = service.investigate(caseFile.id, { locationId: "backstage_lounge" });
    const sideDoor = service.investigate(caseFile.id, { locationId: "stage_side_door" });
    const propRoom = service.investigate(caseFile.id, { locationId: "prop_room" });
    const securityRoom = service.investigate(caseFile.id, { locationId: "security_room" });

    expect(frontHall.newlyDiscoveredEvidenceIds).toEqual(["front_hall_signup", "front_hall_departure_clue"]);
    expect(backstage.newlyDiscoveredEvidenceIds).toEqual(["victim_teacup", "poisoned_teacup_report", "torn_will_copy"]);
    expect(sideDoor.newlyDiscoveredEvidenceIds).toEqual(["side_door_footprint", "side_door_heelprint"]);
    expect(propRoom.newlyDiscoveredEvidenceIds).toEqual(["bloody_prop"]);
    expect(securityRoom.newlyDiscoveredEvidenceIds).toEqual(["front_hall_cctv"]);
  });

  it("marks key evidence discovery with a clear hint and keeps repeated investigation quiet", () => {
    const service = new CaseService();
    const caseFile = service.startCase();

    const first = service.investigate(caseFile.id, { locationId: "security_room" });
    const second = service.investigate(caseFile.id, { locationId: "security_room" });

    expect(first.hint).toContain("关键证据");
    expect(first.narrativeText).toContain("21:12");
    expect(second.newlyDiscoveredEvidenceIds).toEqual([]);
    expect(second.hint).toBeUndefined();
  });

  it("hits Shen Qiao contradiction after alibi and CCTV evidence are discovered", () => {
    const service = new CaseService();
    const caseFile = service.startCase();
    service.investigate(caseFile.id, { locationId: "front_hall" });
    service.investigate(caseFile.id, { locationId: "security_room" });

    const response = service.interrogate({
      caseId: caseFile.id,
      suspectId: "shen_qiao",
      playerMessage: "监控显示你 21:12 离开前厅去了后台，这和你的不在场证明矛盾。",
      dialogueHistory: [],
      discoveredEvidenceIds: []
    });

    expect(response.contradictionHits).toContain("shenqiao_alibi_contradiction");
    expect(response.updatedSuspectState.pressure).toBeGreaterThan(0);
  });

  it("varies Shen Qiao replies by interrogation intent and escalates when key evidence is known", () => {
    const service = new CaseService();
    const caseFile = service.startCase();

    const alibi = service.interrogate({
      caseId: caseFile.id,
      suspectId: "shen_qiao",
      playerMessage: "案发时间你在哪里？你的不在场证明是什么？",
      dialogueHistory: [],
      discoveredEvidenceIds: []
    });
    service.investigate(caseFile.id, { locationId: "backstage_lounge" });
    service.investigate(caseFile.id, { locationId: "security_room" });
    const pressure = service.interrogate({
      caseId: caseFile.id,
      suspectId: "shen_qiao",
      playerMessage: "监控、茶杯毒物检测和遗嘱复印件都指向你，你怎么解释？",
      dialogueHistory: [],
      discoveredEvidenceIds: []
    });

    expect(alibi.newlyDiscoveredEvidenceIds).toContain("shen_qiao_alibi_claim");
    expect(alibi.npcMessage).toContain("21:00");
    expect(pressure.npcMessage).toContain("茶杯");
    expect(pressure.npcMessage).toContain("遗嘱");
    expect(pressure.npcMessage).not.toContain("我认罪");
  });

  it("lets Chen Dai gradually trust the detective and unlock his testimony", () => {
    const service = new CaseService();
    const caseFile = service.startCase();

    const first = service.interrogate({
      caseId: caseFile.id,
      suspectId: "chen_dai",
      playerMessage: "别害怕，慢慢说，这对查清真相很重要。",
      dialogueHistory: [],
      discoveredEvidenceIds: []
    });
    const second = service.interrogate({
      caseId: caseFile.id,
      suspectId: "chen_dai",
      playerMessage: "我会保护你，你只是说出看到的。",
      dialogueHistory: [],
      discoveredEvidenceIds: []
    });

    expect(first.updatedSuspectState.trust).toBeGreaterThan(10);
    expect(second.newlyDiscoveredEvidenceIds).toContain("chen_dai_testimony");
    expect(second.npcMessage).toContain("沈乔");
    expect(second.npcMessage).toContain("后台");
  });

  it("keeps red herring suspects suspicious without creating a new truth", () => {
    const service = new CaseService();
    const caseFile = service.startCase();

    const hanMu = service.interrogate({
      caseId: caseFile.id,
      suspectId: "han_mu",
      playerMessage: "你和死者的投资纠纷是不是杀人动机？案发时间你在哪？",
      dialogueHistory: [],
      discoveredEvidenceIds: []
    });
    const xuLan = service.interrogate({
      caseId: caseFile.id,
      suspectId: "xu_lan",
      playerMessage: "你和死者是什么关系？你替他隐瞒过什么丑闻？",
      dialogueHistory: [],
      discoveredEvidenceIds: []
    });

    expect(hanMu.npcMessage).toContain("投资");
    expect(hanMu.npcMessage).toContain("彩排");
    expect(hanMu.npcMessage).not.toContain("真凶");
    expect(xuLan.npcMessage).toContain("旧事");
    expect(xuLan.npcMessage).not.toContain("沈乔是真凶");
  });

  it("scores a supported final report and only then returns truth summary", () => {
    const service = new CaseService();
    const caseFile = service.startCase();
    service.investigate(caseFile.id, { locationId: "backstage_lounge" });
    service.investigate(caseFile.id, { locationId: "security_room" });
    service.interrogate({
      caseId: caseFile.id,
      suspectId: "chen_dai",
      playerMessage: "别害怕，慢慢说，这对查清真相很重要。",
      dialogueHistory: [],
      discoveredEvidenceIds: []
    });
    service.interrogate({
      caseId: caseFile.id,
      suspectId: "chen_dai",
      playerMessage: "我会保护你，你只是说出看到的。",
      dialogueHistory: [],
      discoveredEvidenceIds: []
    });

    const result = service.submitFinalReport(caseFile.id, {
      culpritId: "shen_qiao",
      motive: "林远舟发现沈乔伪造遗嘱的秘密，并以此威胁她。",
      method: "她在死者茶杯中投毒，导致中毒死亡。",
      timeline: "21:12 沈乔离开前厅进入后台。",
      keyEvidenceIds: [
        "front_hall_cctv",
        "poisoned_teacup_report",
        "torn_will_copy",
        "chen_dai_testimony"
      ],
      explanation: "监控、毒物检测、遗嘱复印件和陈岱证词形成完整证据链。"
    });

    expect(result.score).toBe(100);
    expect(result.verdict).toBe("完美破案");
    expect(result.truthSummary).toContain("沈乔");
  });

  it("does not score undiscovered evidence ids in a final report", () => {
    const service = new CaseService();
    const caseFile = service.startCase();

    const result = service.submitFinalReport(caseFile.id, {
      culpritId: "shen_qiao",
      motive: "她有别的原因。",
      method: "她用了某种方式。",
      timeline: "她找到了机会。",
      keyEvidenceIds: [
        "front_hall_cctv",
        "poisoned_teacup_report",
        "torn_will_copy",
        "chen_dai_testimony"
      ],
      explanation: "这些证据 ID 不应该在未发现时直接计分。"
    });

    expect(result.score).toBe(30);
    expect(result.correctFields).toEqual(["凶手"]);
    expect(result.missedFields).toEqual(["动机", "手段", "时间线", "关键证据"]);
  });

  it("applies a small final score penalty when the player used hints", () => {
    const service = new CaseService();
    const caseFile = service.startCase();
    service.investigate(caseFile.id, { locationId: "backstage_lounge" });
    service.investigate(caseFile.id, { locationId: "security_room" });
    service.interrogate({
      caseId: caseFile.id,
      suspectId: "chen_dai",
      playerMessage: "别害怕，慢慢说，这对查清真相很重要。",
      dialogueHistory: [],
      discoveredEvidenceIds: []
    });
    service.interrogate({
      caseId: caseFile.id,
      suspectId: "chen_dai",
      playerMessage: "我会保护你，你只是说出看到的。",
      dialogueHistory: [],
      discoveredEvidenceIds: []
    });

    const result = service.submitFinalReport(caseFile.id, {
      culpritId: "shen_qiao",
      motive: "林远舟发现沈乔伪造遗嘱的秘密，并以此威胁她。",
      method: "她在死者茶杯中投毒。",
      timeline: "21:12 沈乔离开前厅进入后台。",
      keyEvidenceIds: [
        "front_hall_cctv",
        "poisoned_teacup_report",
        "torn_will_copy",
        "chen_dai_testimony"
      ],
      explanation: "证据链完整，但我使用了提示。",
      hintCount: 3
    });

    expect(result.score).toBe(85);
    expect(result.verdict).toBe("成功破案，但仍有细节不完整");
    expect(result.feedback).toContain("使用了 3 次提示");
  });
});

describe("MockCaseService", () => {
  it("keeps the fixed case truth internally while returning a public case", () => {
    const service = new MockCaseService();
    const publicCase = service.startCase();
    const internalCase = service.getInternalCase(publicCase.id);
    const serializedPublicCase = JSON.stringify(publicCase);

    expect(internalCase.truth.culpritId).toBe("shen_qiao");
    expect(internalCase.suspects.find((suspect) => suspect.id === "shen_qiao")?.isCulprit).toBe(true);
    expect(publicCase.title).toBe("雨夜剧院谋杀案");
    expect(serializedPublicCase).not.toContain("truth");
    expect(serializedPublicCase).not.toContain("culpritId");
    expect(serializedPublicCase).not.toContain("hiddenSecret");
    expect(serializedPublicCase).not.toContain("isCulprit");
  });

  it("discovers evidence and keeps undiscovered evidence hidden in public state", () => {
    const service = new MockCaseService();
    const publicCase = service.startCase();

    const initialEvidence = publicCase.evidence.find((evidence) => evidence.id === "front_hall_cctv");
    const updatedCase = service.discoverEvidence(publicCase.id, "front_hall_cctv");
    const discoveredEvidence = updatedCase.evidence.find((evidence) => evidence.id === "front_hall_cctv");

    expect(initialEvidence?.discovered).toBe(false);
    expect(initialEvidence?.title).toBe("未发现线索");
    expect(discoveredEvidence?.discovered).toBe(true);
    expect(discoveredEvidence?.title).toBe("前厅监控录像");
  });

  it("records contradiction hits and unlocks related evidence", () => {
    const service = new MockCaseService();
    const publicCase = service.startCase();
    const updatedCase = service.hitContradiction(publicCase.id, "shenqiao_alibi_contradiction");
    const shenQiao = updatedCase.suspects.find((suspect) => suspect.id === "shen_qiao");

    expect(shenQiao?.currentState.discoveredContradictionIds).toContain("shenqiao_alibi_contradiction");
    expect(updatedCase.evidence.find((evidence) => evidence.id === "shen_qiao_pressure_note")?.discovered).toBe(true);
  });
});
