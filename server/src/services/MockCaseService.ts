import type {
  CaseFile,
  Evidence,
  EvidenceSummary,
  PublicCaseFile,
  PublicSuspect,
  Suspect,
  SuspectState
} from "@blackbox-detective/shared";
import { mockCase } from "../data/mockCase";
import { HttpError } from "./CaseService";

const cloneState = (state: SuspectState): SuspectState => ({
  trust: state.trust,
  pressure: state.pressure,
  defense: state.defense,
  unlockedEvidenceIds: [...state.unlockedEvidenceIds],
  discoveredContradictionIds: [...state.discoveredContradictionIds]
});

const cloneEvidence = (evidence: Evidence): Evidence => ({
  ...evidence,
  relatedSuspectIds: [...evidence.relatedSuspectIds],
  tags: [...evidence.tags]
});

const cloneSuspect = (suspect: Suspect): Suspect => ({
  ...suspect,
  knowledge: [...suspect.knowledge],
  lies: [...suspect.lies],
  revealRules: suspect.revealRules.map((rule) => ({
    ...rule,
    requiredEvidenceIds: rule.requiredEvidenceIds ? [...rule.requiredEvidenceIds] : undefined,
    unlockEvidenceIds: [...rule.unlockEvidenceIds]
  })),
  currentState: cloneState(suspect.currentState)
});

export class MockCaseService {
  private readonly cases = new Map<string, CaseFile>();

  startCase(): PublicCaseFile {
    const caseFile = this.createCaseFile();
    this.cases.set(caseFile.id, caseFile);
    return this.toPublicCase(caseFile);
  }

  getCase(caseId: string): PublicCaseFile {
    return this.toPublicCase(this.requireCase(caseId));
  }

  getInternalCase(caseId: string): CaseFile {
    return this.requireCase(caseId);
  }

  discoverEvidence(caseId: string, evidenceId: string): PublicCaseFile {
    const caseFile = this.requireCase(caseId);
    const evidence = caseFile.evidence.find((item) => item.id === evidenceId);
    if (!evidence) {
      throw new HttpError(404, "证据不存在。");
    }

    evidence.discovered = true;
    return this.toPublicCase(caseFile);
  }

  hitContradiction(caseId: string, contradictionId: string): PublicCaseFile {
    const caseFile = this.requireCase(caseId);
    const contradiction = caseFile.contradictions.find((item) => item.id === contradictionId);
    if (!contradiction) {
      throw new HttpError(404, "矛盾不存在。");
    }

    const suspect = caseFile.suspects.find((item) => item.id === contradiction.suspectId);
    if (!suspect) {
      throw new HttpError(404, "矛盾关联的嫌疑人不存在。");
    }

    if (!suspect.currentState.discoveredContradictionIds.includes(contradiction.id)) {
      suspect.currentState.discoveredContradictionIds.push(contradiction.id);
    }

    contradiction.unlockedEvidenceIds.forEach((evidenceId) => {
      const evidence = caseFile.evidence.find((item) => item.id === evidenceId);
      if (evidence) {
        evidence.discovered = true;
      }
      if (!suspect.currentState.unlockedEvidenceIds.includes(evidenceId)) {
        suspect.currentState.unlockedEvidenceIds.push(evidenceId);
      }
    });

    return this.toPublicCase(caseFile);
  }

  private createCaseFile(): CaseFile {
    return {
      id: `case_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: mockCase.title,
      synopsis: mockCase.synopsis,
      victim: mockCase.victim,
      truth: {
        ...mockCase.truth,
        keyEvidenceIds: [...mockCase.truth.keyEvidenceIds]
      },
      suspects: mockCase.suspects.map(cloneSuspect),
      locations: mockCase.locations.map((location) => ({
        ...location,
        evidenceIds: [...location.evidenceIds],
        suspectIds: [...location.suspectIds]
      })),
      evidence: mockCase.evidence.map((evidence) => ({
        ...cloneEvidence(evidence),
        discovered: false
      })),
      contradictions: mockCase.contradictions.map((contradiction) => ({
        ...contradiction,
        unlockedEvidenceIds: [...contradiction.unlockedEvidenceIds]
      })),
      startedAt: new Date().toISOString()
    };
  }

  private requireCase(caseId: string): CaseFile {
    const caseFile = this.cases.get(caseId);
    if (!caseFile) {
      throw new HttpError(404, "案件不存在。");
    }
    return caseFile;
  }

  private toPublicCase(caseFile: CaseFile): PublicCaseFile {
    return {
      id: caseFile.id,
      title: caseFile.title,
      synopsis: caseFile.synopsis,
      victim: caseFile.victim,
      suspects: caseFile.suspects.map((suspect) => this.toPublicSuspect(suspect)),
      locations: caseFile.locations,
      evidence: caseFile.evidence.map((evidence) => this.toEvidenceSummary(evidence)),
      contradictions: caseFile.contradictions,
      startedAt: caseFile.startedAt
    };
  }

  private toPublicSuspect(suspect: Suspect): PublicSuspect {
    return {
      id: suspect.id,
      name: suspect.name,
      role: suspect.role,
      age: suspect.age,
      personality: suspect.personality,
      publicProfile: suspect.publicProfile,
      currentState: cloneState(suspect.currentState)
    };
  }

  private toEvidenceSummary(evidence: Evidence): EvidenceSummary {
    if (!evidence.discovered) {
      return {
        id: evidence.id,
        type: evidence.type,
        title: "未发现线索",
        discovered: false
      };
    }

    return {
      id: evidence.id,
      type: evidence.type,
      title: evidence.title,
      description: evidence.description,
      source: evidence.source,
      relatedSuspectIds: [...evidence.relatedSuspectIds],
      tags: [...evidence.tags],
      isKeyEvidence: evidence.isKeyEvidence,
      discovered: true
    };
  }
}
