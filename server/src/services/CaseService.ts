import type {
  CaseResult,
  Evidence,
  EvidenceSummary,
  FinalReport,
  InterrogateRequest,
  InterrogateResponse,
  InvestigationRequest,
  InvestigationResponse,
  PublicCaseFile,
  PublicSuspect,
  Suspect,
  SuspectState
} from "@blackbox-detective/shared";
import { mockCase } from "../data/mockCase";
import { createLlmProvider } from "./llm/ProviderFactory";

interface CaseRuntimeState {
  id: string;
  startedAt: string;
  discoveredEvidenceIds: Set<string>;
  investigatedLocationIds: Set<string>;
  suspectStates: Map<string, SuspectState>;
  finalReportSubmitted: boolean;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

const cloneState = (state: SuspectState): SuspectState => ({
  trust: state.trust,
  pressure: state.pressure,
  defense: state.defense,
  unlockedEvidenceIds: [...state.unlockedEvidenceIds],
  discoveredContradictionIds: [...state.discoveredContradictionIds]
});

const hasAny = (text: string, keywords: string[]) => keywords.some((keyword) => text.includes(keyword));

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export class CaseService {
  private readonly cases = new Map<string, CaseRuntimeState>();
  private readonly llmProvider = createLlmProvider();

  startCase(): PublicCaseFile {
    const id = `case_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const state: CaseRuntimeState = {
      id,
      startedAt: new Date().toISOString(),
      discoveredEvidenceIds: new Set<string>(),
      investigatedLocationIds: new Set<string>(),
      suspectStates: new Map(mockCase.suspects.map((suspect) => [suspect.id, cloneState(suspect.currentState)])),
      finalReportSubmitted: false
    };

    this.cases.set(id, state);
    return this.toPublicCase(state);
  }

  getCase(caseId: string): PublicCaseFile {
    return this.toPublicCase(this.requireCase(caseId));
  }

  investigate(caseId: string, request: InvestigationRequest): InvestigationResponse {
    const state = this.requireCase(caseId);
    const location = mockCase.locations.find((item) => item.id === request.locationId);
    if (!location) {
      throw new HttpError(404, "调查地点不存在。");
    }

    const alreadyInvestigated = state.investigatedLocationIds.has(location.id);
    state.investigatedLocationIds.add(location.id);

    const newlyDiscoveredEvidenceIds = alreadyInvestigated
      ? []
      : location.evidenceIds.filter((evidenceId) => this.discoverEvidence(state, evidenceId));

    const narrativeText = alreadyInvestigated
      ? `${location.name}已经调查过了。雨声仍在继续，但这里没有新的线索。`
      : this.locationNarrative(location.name, newlyDiscoveredEvidenceIds);

    return {
      narrativeText,
      newlyDiscoveredEvidenceIds,
      unlockedLocationIds: [],
      hint: this.investigationHint(newlyDiscoveredEvidenceIds),
      caseFile: this.toPublicCase(state)
    };
  }

  interrogate(request: InterrogateRequest): InterrogateResponse {
    const state = this.requireCase(request.caseId);
    const playerMessage = request.playerMessage.trim();
    if (!playerMessage) {
      throw new HttpError(400, "玩家问题不能为空。");
    }

    const suspect = this.requireSuspect(request.suspectId);
    const currentState = cloneState(this.requireSuspectState(state, suspect.id));
    const before = cloneState(currentState);
    const newlyDiscoveredEvidenceIds: string[] = [];
    const contradictionHits: string[] = [];
    const normalized = playerMessage.toLowerCase();

    if (suspect.id === "shen_qiao" && hasAny(normalized, ["不在场", "21:00", "前厅", "后台", "案发"])) {
      if (this.discoverEvidence(state, "shen_qiao_alibi_claim")) {
        newlyDiscoveredEvidenceIds.push("shen_qiao_alibi_claim");
      }
    }

    if (suspect.id === "chen_dai" && hasAny(playerMessage, ["别害怕", "保护你", "慢慢说", "说出看到", "查清真相", "不用怕"])) {
      currentState.trust = clamp(currentState.trust + 35);
      currentState.defense = clamp(currentState.defense - 25);
    }

    if (suspect.id === "chen_dai" && currentState.trust >= 60) {
      if (this.discoverEvidence(state, "chen_dai_testimony")) {
        newlyDiscoveredEvidenceIds.push("chen_dai_testimony");
        currentState.unlockedEvidenceIds.push("chen_dai_testimony");
      }
    }

    const contradiction = mockCase.contradictions[0];
    const canHitShenContradiction =
      suspect.id === "shen_qiao" &&
      state.discoveredEvidenceIds.has("shen_qiao_alibi_claim") &&
      state.discoveredEvidenceIds.has("front_hall_cctv") &&
      hasAny(playerMessage, ["21:12", "监控", "前厅", "离开", "后台", "撒谎", "矛盾"]);

    if (contradiction && canHitShenContradiction && !currentState.discoveredContradictionIds.includes(contradiction.id)) {
      currentState.pressure = clamp(currentState.pressure + 35);
      currentState.defense = clamp(currentState.defense - 25);
      currentState.discoveredContradictionIds.push(contradiction.id);
      contradictionHits.push(contradiction.id);
    }

    state.suspectStates.set(suspect.id, currentState);
    const extractedEvidence = newlyDiscoveredEvidenceIds
      .map((id) => this.evidenceSummary(state, id))
      .filter((evidence): evidence is EvidenceSummary => Boolean(evidence));

    const publicSuspect = this.toPublicSuspect(suspect, currentState);
    const llmOutput = this.llmProvider.interrogate({
      suspect: publicSuspect,
      playerMessage,
      dialogueHistory: request.dialogueHistory,
      discoveredEvidence: this.discoveredEvidence(state),
      suspectState: currentState,
      contradictionHit: contradictionHits.length > 0,
      knownFacts: suspect.knowledge,
      withheldFacts: suspect.lies
    });

    return {
      npcMessage: llmOutput.npcMessage,
      extractedEvidence,
      newlyDiscoveredEvidenceIds,
      contradictionHits,
      suspectStateDelta: {
        trust: currentState.trust - before.trust,
        pressure: currentState.pressure - before.pressure,
        defense: currentState.defense - before.defense
      },
      updatedSuspectState: currentState,
      caseFile: this.toPublicCase(state)
    };
  }

  submitFinalReport(caseId: string, report: FinalReport): CaseResult {
    const state = this.requireCase(caseId);
    if (!report.culpritId || !report.motive.trim() || !report.method.trim() || !report.timeline.trim()) {
      throw new HttpError(400, "最终报告缺少必要字段。");
    }

    state.finalReportSubmitted = true;
    const selectedDiscoveredEvidenceIds = report.keyEvidenceIds.filter((id) => state.discoveredEvidenceIds.has(id));
    const correctFields: string[] = [];
    const missedFields: string[] = [];
    let score = 0;

    if (report.culpritId === mockCase.truth.culpritId) {
      score += 30;
      correctFields.push("凶手");
    } else {
      missedFields.push("凶手");
    }

    if (
      this.textOrEvidence(
        report.motive,
        ["遗嘱", "伪造", "秘密", "死者发现", "发现", "威胁"],
        selectedDiscoveredEvidenceIds,
        ["torn_will_copy"]
      )
    ) {
      score += 20;
      correctFields.push("动机");
    } else {
      missedFields.push("动机");
    }

    if (this.textOrEvidence(report.method, ["茶杯", "毒", "中毒", "投毒"], selectedDiscoveredEvidenceIds, ["poisoned_teacup_report"])) {
      score += 20;
      correctFields.push("手段");
    } else {
      missedFields.push("手段");
    }

    if (this.textOrEvidence(report.timeline, ["21:12", "前厅", "后台", "离开"], selectedDiscoveredEvidenceIds, ["front_hall_cctv"])) {
      score += 15;
      correctFields.push("时间线");
    } else {
      missedFields.push("时间线");
    }

    const selectedKeyEvidence = mockCase.truth.keyEvidenceIds.filter((id) => selectedDiscoveredEvidenceIds.includes(id));
    if (selectedKeyEvidence.length >= 3) {
      score += 15;
      correctFields.push("关键证据");
    } else {
      missedFields.push("关键证据");
    }

    const hintCount = Math.max(0, Math.min(3, Math.floor(report.hintCount ?? 0)));
    const hintPenalty = hintCount * 5;
    score = Math.max(0, score - hintPenalty);
    const hintFeedback = hintCount > 0 ? `你使用了 ${hintCount} 次提示，最终评价扣除 ${hintPenalty} 分。` : "";
    const baseFeedback =
      score >= 70 ? "你的证据链足以支撑结论。" : "当前推理仍缺少关键支撑，建议重新审视时间线和动机证据。";

    return {
      score,
      verdict: this.verdict(score),
      correctFields,
      missedFields,
      feedback: [baseFeedback, hintFeedback].filter(Boolean).join(" "),
      truthSummary:
        "真相：沈乔因伪造遗嘱的秘密被林远舟发现而起意，在死者茶杯中投毒，并用 21:00 后一直在前厅的说法伪造不在场证明。"
    };
  }

  private requireCase(caseId: string): CaseRuntimeState {
    const state = this.cases.get(caseId);
    if (!state) {
      throw new HttpError(404, "案件不存在。");
    }
    return state;
  }

  private requireSuspect(suspectId: string): Suspect {
    const suspect = mockCase.suspects.find((item) => item.id === suspectId);
    if (!suspect) {
      throw new HttpError(404, "嫌疑人不存在。");
    }
    return suspect;
  }

  private requireSuspectState(state: CaseRuntimeState, suspectId: string): SuspectState {
    const suspectState = state.suspectStates.get(suspectId);
    if (!suspectState) {
      throw new HttpError(404, "嫌疑人状态不存在。");
    }
    return suspectState;
  }

  private discoverEvidence(state: CaseRuntimeState, evidenceId: string): boolean {
    if (state.discoveredEvidenceIds.has(evidenceId)) {
      return false;
    }
    state.discoveredEvidenceIds.add(evidenceId);
    return true;
  }

  private toPublicCase(state: CaseRuntimeState): PublicCaseFile {
    return {
      id: state.id,
      title: mockCase.title,
      synopsis: mockCase.synopsis,
      victim: mockCase.victim,
      suspects: mockCase.suspects.map((suspect) =>
        this.toPublicSuspect(suspect, cloneState(this.requireSuspectState(state, suspect.id)))
      ),
      locations: mockCase.locations,
      evidence: mockCase.evidence.map((evidence) => this.evidenceSummary(state, evidence.id)).filter(Boolean) as EvidenceSummary[],
      contradictions: mockCase.contradictions,
      startedAt: state.startedAt
    };
  }

  private toPublicSuspect(suspect: Suspect, currentState: SuspectState): PublicSuspect {
    return {
      id: suspect.id,
      name: suspect.name,
      role: suspect.role,
      age: suspect.age,
      personality: suspect.personality,
      publicProfile: suspect.publicProfile,
      currentState
    };
  }

  private evidenceSummary(state: CaseRuntimeState, evidenceId: string): EvidenceSummary | undefined {
    const evidence = mockCase.evidence.find((item) => item.id === evidenceId);
    if (!evidence) {
      return undefined;
    }

    if (!state.discoveredEvidenceIds.has(evidence.id)) {
      return {
        id: evidence.id,
        type: evidence.type,
        title: "未发现线索",
        discovered: false
      };
    }

    return this.toDiscoveredEvidence(evidence);
  }

  private discoveredEvidence(state: CaseRuntimeState): EvidenceSummary[] {
    return mockCase.evidence
      .filter((evidence) => state.discoveredEvidenceIds.has(evidence.id))
      .map((evidence) => this.toDiscoveredEvidence(evidence));
  }

  private toDiscoveredEvidence(evidence: Evidence): EvidenceSummary {
    return {
      id: evidence.id,
      type: evidence.type,
      title: evidence.title,
      discovered: true,
      source: evidence.source,
      description: evidence.description,
      relatedSuspectIds: evidence.relatedSuspectIds,
      tags: evidence.tags,
      isKeyEvidence: evidence.isKeyEvidence
    };
  }

  private locationNarrative(locationName: string, evidenceIds: string[]): string {
    if (evidenceIds.length === 0) {
      return `你仔细检查了${locationName}，暂时没有发现新的可用线索。`;
    }

    const evidence = evidenceIds
      .map((id) => mockCase.evidence.find((item) => item.id === id))
      .filter((item): item is Evidence => Boolean(item));
    const titles = evidence.map((item) => item.title).join("、");
    const descriptions = evidence.map((item) => item.description).join(" ");
    return `你调查了${locationName}，发现了：${titles}。${descriptions}`;
  }

  private investigationHint(evidenceIds: string[]): string | undefined {
    if (evidenceIds.length === 0) {
      return undefined;
    }

    const hasKeyEvidence = evidenceIds.some((id) => mockCase.evidence.find((evidence) => evidence.id === id)?.isKeyEvidence);
    return hasKeyEvidence ? "发现关键证据，已加入证据板。" : "新证据已加入证据板。";
  }

  private textOrEvidence(text: string, keywords: string[], selectedEvidenceIds: string[], evidenceIds: string[]): boolean {
    return hasAny(text, keywords) || evidenceIds.some((id) => selectedEvidenceIds.includes(id));
  }

  private verdict(score: number): string {
    if (score >= 90) return "完美破案";
    if (score >= 70) return "成功破案，但仍有细节不完整";
    if (score >= 40) return "嫌疑成立，但证据链不足";
    return "错误指控或推理失败";
  }
}
