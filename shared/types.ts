export type EvidenceType =
  | "physical"
  | "testimony"
  | "timeline"
  | "relationship"
  | "contradiction";

export interface SuspectState {
  trust: number;
  pressure: number;
  defense: number;
  unlockedEvidenceIds: string[];
  discoveredContradictionIds: string[];
}

export interface RevealRule {
  id: string;
  description: string;
  requiredTrust?: number;
  requiredPressure?: number;
  requiredEvidenceIds?: string[];
  unlockEvidenceIds: string[];
}

export interface Suspect {
  id: string;
  name: string;
  role: string;
  age: number;
  personality: string;
  publicProfile: string;
  hiddenSecret: string;
  isCulprit: boolean;
  knowledge: string[];
  lies: string[];
  revealRules: RevealRule[];
  currentState: SuspectState;
}

export type PublicSuspect = Omit<Suspect, "hiddenSecret" | "isCulprit" | "knowledge" | "lies" | "revealRules">;

export interface Location {
  id: string;
  name: string;
  description: string;
  evidenceIds: string[];
  suspectIds: string[];
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  source: string;
  relatedSuspectIds: string[];
  tags: string[];
  isKeyEvidence: boolean;
  discovered: boolean;
}

export interface EvidenceSummary {
  id: string;
  type: EvidenceType;
  title: string;
  discovered: boolean;
  source?: string;
  description?: string;
  relatedSuspectIds?: string[];
  tags?: string[];
  isKeyEvidence?: boolean;
}

export interface Contradiction {
  id: string;
  title: string;
  claimEvidenceId: string;
  counterEvidenceId: string;
  suspectId: string;
  description: string;
  unlockedEvidenceIds: string[];
}

export interface DialogueMessage {
  speaker: "player" | "npc" | "system";
  speakerId?: string;
  text: string;
  timestamp: string;
  extractedEvidenceIds: string[];
  contradictionHits: string[];
}

export interface CaseFile {
  id: string;
  title: string;
  synopsis: string;
  victim: string;
  truth: Truth;
  suspects: Suspect[];
  locations: Location[];
  evidence: Evidence[];
  contradictions: Contradiction[];
  startedAt: string;
}

export interface PublicCaseFile extends Omit<CaseFile, "truth" | "suspects" | "evidence"> {
  suspects: PublicSuspect[];
  evidence: EvidenceSummary[];
}

export interface Truth {
  culpritId: string;
  motive: string;
  method: string;
  timeline: string;
  fakeAlibi: string;
  keyEvidenceIds: string[];
}

export interface InvestigationRequest {
  locationId: string;
  targetId?: string;
}

export interface InvestigationResponse {
  narrativeText: string;
  newlyDiscoveredEvidenceIds: string[];
  unlockedLocationIds: string[];
  hint?: string;
  caseFile: PublicCaseFile;
}

export interface InterrogateRequest {
  caseId: string;
  suspectId: string;
  playerMessage: string;
  dialogueHistory: DialogueMessage[];
  discoveredEvidenceIds: string[];
}

export interface InterrogateResponse {
  npcMessage: string;
  extractedEvidence: EvidenceSummary[];
  newlyDiscoveredEvidenceIds: string[];
  contradictionHits: string[];
  suspectStateDelta: Partial<SuspectState>;
  updatedSuspectState: SuspectState;
  caseFile: PublicCaseFile;
}

export interface FinalReport {
  culpritId: string;
  motive: string;
  method: string;
  timeline: string;
  keyEvidenceIds: string[];
  explanation: string;
  hintCount?: number;
}

export interface CaseResult {
  score: number;
  verdict: string;
  correctFields: string[];
  missedFields: string[];
  feedback: string;
  truthSummary?: string;
}

export type ReasoningSlot = "motive" | "method" | "opportunity" | "contradiction" | "accusation";

export type ReasoningSlots = Record<ReasoningSlot, string[]>;
