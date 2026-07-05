import type {
  CaseFile,
  DialogueMessage,
  EvidenceSummary,
  PublicSuspect,
  SuspectState
} from "@blackbox-detective/shared";

export interface GenerateCaseInput {
  theme?: string;
  title?: string;
  constraints?: string[];
}

export interface GenerateCaseOutput {
  caseDraft: Omit<CaseFile, "id" | "startedAt">;
  providerNotes: string[];
}

export interface InterrogateInput {
  suspect: PublicSuspect;
  playerMessage: string;
  dialogueHistory: DialogueMessage[];
  discoveredEvidence: EvidenceSummary[];
  suspectState: SuspectState;
  contradictionHit: boolean;
  knownFacts: string[];
  withheldFacts: string[];
}

export interface InterrogateOutput {
  npcMessage: string;
  parsedIntent?: string;
}

export interface LlmProvider {
  generateCase(input: GenerateCaseInput): GenerateCaseOutput;
  interrogate(input: InterrogateInput): InterrogateOutput;
}
