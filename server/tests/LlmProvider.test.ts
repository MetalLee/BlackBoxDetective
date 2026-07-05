import { describe, expect, it } from "vitest";
import type { EvidenceSummary, PublicSuspect, SuspectState } from "@blackbox-detective/shared";
import { createLlmProvider } from "../src/services/llm/ProviderFactory";
import { MockLlmProvider } from "../src/services/llm/MockLlmProvider";

const suspectState: SuspectState = {
  trust: 20,
  pressure: 10,
  defense: 80,
  unlockedEvidenceIds: [],
  discoveredContradictionIds: []
};

const shenQiao: PublicSuspect = {
  id: "shen_qiao",
  name: "沈乔",
  role: "女主演",
  age: 32,
  personality: "冷静克制，擅长转移话题",
  publicProfile: "剧院女主演。",
  currentState: suspectState
};

const discoveredEvidence: EvidenceSummary[] = [
  {
    id: "front_hall_cctv",
    type: "timeline",
    title: "前厅监控录像",
    discovered: true
  }
];

describe("LLM provider abstraction", () => {
  it("uses the mock provider by default and returns constrained NPC dialogue", () => {
    const provider = createLlmProvider();

    const output = provider.interrogate({
      suspect: shenQiao,
      playerMessage: "案发时间你在哪里？",
      dialogueHistory: [],
      discoveredEvidence,
      suspectState,
      contradictionHit: false,
      knownFacts: ["沈乔声称 21:00 后一直在前厅。"],
      withheldFacts: ["不要直接承认真凶身份。"]
    });

    expect(provider).toBeInstanceOf(MockLlmProvider);
    expect(output.npcMessage).toContain("21:00");
    expect(output.npcMessage).not.toContain("真凶");
  });

  it("rejects unimplemented real providers with a clear error", () => {
    const originalProvider = process.env.LLM_PROVIDER;
    process.env.LLM_PROVIDER = "openai";

    try {
      expect(() => createLlmProvider()).toThrow("Real LLM provider is not implemented yet.");
    } finally {
      if (originalProvider === undefined) {
        delete process.env.LLM_PROVIDER;
      } else {
        process.env.LLM_PROVIDER = originalProvider;
      }
    }
  });
});
