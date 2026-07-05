import { MockLlmProvider } from "./MockLlmProvider";
import type { LlmProvider } from "./types";

export const createLlmProvider = (): LlmProvider => {
  const provider = process.env.LLM_PROVIDER ?? "mock";

  if (provider === "mock") {
    return new MockLlmProvider();
  }

  throw new Error("Real LLM provider is not implemented yet.");
};
