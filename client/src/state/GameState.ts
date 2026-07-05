import type {
  CaseResult,
  DialogueMessage,
  EvidenceSummary,
  PublicCaseFile,
  ReasoningSlot,
  ReasoningSlots
} from "@blackbox-detective/shared";

interface PersistedState {
  currentCase: PublicCaseFile | null;
  selectedLocationId: string | null;
  selectedSuspectId: string | null;
  dialogueHistoryBySuspect: Record<string, DialogueMessage[]>;
  reasoningSlots: ReasoningSlots;
  finalResult: CaseResult | null;
  tutorialSeen: boolean;
  hintCount: number;
}

const storageKey = "blackbox-detective-state";

const emptyReasoningSlots = (): ReasoningSlots => ({
  motive: [],
  method: [],
  opportunity: [],
  contradiction: [],
  accusation: []
});

class GameState {
  currentCase: PublicCaseFile | null = null;
  selectedLocationId: string | null = null;
  selectedSuspectId: string | null = null;
  dialogueHistoryBySuspect: Record<string, DialogueMessage[]> = {};
  reasoningSlots: ReasoningSlots = emptyReasoningSlots();
  finalResult: CaseResult | null = null;
  tutorialSeen = false;
  hintCount = 0;

  load() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PersistedState;
      this.currentCase = parsed.currentCase;
      this.selectedLocationId = parsed.selectedLocationId;
      this.selectedSuspectId = parsed.selectedSuspectId;
      this.dialogueHistoryBySuspect = parsed.dialogueHistoryBySuspect ?? {};
      this.reasoningSlots = parsed.reasoningSlots ?? emptyReasoningSlots();
      this.finalResult = parsed.finalResult;
      this.tutorialSeen = parsed.tutorialSeen ?? false;
      this.hintCount = parsed.hintCount ?? 0;
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  save() {
    const payload: PersistedState = {
      currentCase: this.currentCase,
      selectedLocationId: this.selectedLocationId,
      selectedSuspectId: this.selectedSuspectId,
      dialogueHistoryBySuspect: this.dialogueHistoryBySuspect,
      reasoningSlots: this.reasoningSlots,
      finalResult: this.finalResult,
      tutorialSeen: this.tutorialSeen,
      hintCount: this.hintCount
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }

  setCase(caseFile: PublicCaseFile) {
    this.currentCase = caseFile;
    this.selectedLocationId = this.selectedLocationId ?? caseFile.locations[0]?.id ?? null;
    this.selectedSuspectId = this.selectedSuspectId ?? caseFile.suspects[0]?.id ?? null;
    this.save();
  }

  startNewCase(caseFile: PublicCaseFile) {
    this.currentCase = caseFile;
    this.selectedLocationId = caseFile.locations[0]?.id ?? null;
    this.selectedSuspectId = caseFile.suspects[0]?.id ?? null;
    this.dialogueHistoryBySuspect = {};
    this.reasoningSlots = emptyReasoningSlots();
    this.finalResult = null;
    this.tutorialSeen = false;
    this.hintCount = 0;
    this.save();
  }

  clear() {
    this.currentCase = null;
    this.selectedLocationId = null;
    this.selectedSuspectId = null;
    this.dialogueHistoryBySuspect = {};
    this.reasoningSlots = emptyReasoningSlots();
    this.finalResult = null;
    this.tutorialSeen = false;
    this.hintCount = 0;
    localStorage.removeItem(storageKey);
  }

  markTutorialSeen() {
    this.tutorialSeen = true;
    this.save();
  }

  requestHint() {
    this.hintCount = Math.min(3, this.hintCount + 1);
    this.save();
    return this.currentHint();
  }

  currentHint() {
    const hints = [
      "提示 1：建议去监控室，那里可能记录了前厅的关键时间线。",
      "提示 2：建议追问沈乔 21:12 的行踪，重点问前厅、离开和后台。",
      "提示 3：建议找陈岱确认后台目击，他害怕卷入，需要温和追问。"
    ];
    return hints[Math.max(0, this.hintCount - 1)] ?? hints[2];
  }

  discoveredEvidence(): EvidenceSummary[] {
    return this.currentCase?.evidence.filter((evidence) => evidence.discovered) ?? [];
  }

  dialogueFor(suspectId: string): DialogueMessage[] {
    return this.dialogueHistoryBySuspect[suspectId] ?? [];
  }

  appendDialogue(suspectId: string, messages: DialogueMessage[]) {
    this.dialogueHistoryBySuspect[suspectId] = [...this.dialogueFor(suspectId), ...messages];
    this.save();
  }

  addEvidenceToSlot(slot: ReasoningSlot, evidenceId: string) {
    const current = this.reasoningSlots[slot];
    if (!current.includes(evidenceId)) {
      current.push(evidenceId);
      this.save();
    }
  }
}

export const gameState = new GameState();
