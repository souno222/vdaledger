export const queryKeys = {
  ingestions: {
    root: ["ingestions"] as const,
    all: (userId: string) => ["ingestions", userId] as const,
    detail: (userId: string, jobId: string) =>
      ["ingestions", userId, jobId] as const,
    errors: (userId: string, jobId: string) =>
      ["ingestions", userId, jobId, "errors"] as const,
  },
  ledger: {
    root: ["ledger-events"] as const,
    all: (userId: string) => ["ledger-events", userId] as const,
  },
  portfolio: {
    root: ["portfolio"] as const,
    summary: (userId: string) => ["portfolio", userId] as const,
  },
  tax: {
    root: ["tax"] as const,
    report: (userId: string, financialYear: string) =>
      ["tax", userId, financialYear] as const,
  },
} as const;
