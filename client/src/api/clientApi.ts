import type {
  CaseResult,
  FinalReport,
  InterrogateRequest,
  InterrogateResponse,
  InvestigationRequest,
  InvestigationResponse,
  PublicCaseFile
} from "@blackbox-detective/shared";

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "请求失败，请稍后再试。");
  }

  return (await response.json()) as T;
};

export const clientApi = {
  startCase: () =>
    request<PublicCaseFile>("/api/case/start", {
      method: "POST"
    }),
  getCase: (caseId: string) => request<PublicCaseFile>(`/api/case/${caseId}`),
  investigate: (caseId: string, body: InvestigationRequest) =>
    request<InvestigationResponse>(`/api/case/${caseId}/investigate`, {
      method: "POST",
      body: JSON.stringify(body)
    }),
  interrogate: (body: InterrogateRequest) =>
    request<InterrogateResponse>("/api/interrogate", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  submitFinalReport: (caseId: string, body: FinalReport) =>
    request<CaseResult>(`/api/case/${caseId}/final-report`, {
      method: "POST",
      body: JSON.stringify(body)
    })
};
