export const getAiStarterPrompts = (options?: {
  isElevated?: boolean;
  canViewSalesPage?: boolean;
}): string[] => {
  if (options?.isElevated) {
    return [
      'Show sales team progress for this week',
      'Create a sales KPI template for the team',
      'Draft an invoice for a client',
      'Break down my pipeline by ICP',
    ];
  }

  if (options?.canViewSalesPage) {
    return [
      'Show my leads that need follow-up today',
      'What meetings do I have scheduled this week?',
      'Create a new task card on my board',
      'Show my daily sales KPI progress',
    ];
  }

  return [
    'What meetings do I have scheduled this week?',
    'Create a new task card on my board',
    'Show my active tasks and their deadlines',
    'Get my profile details and daily KPI summary',
  ];
};

export const AI_STARTER_PROMPTS = getAiStarterPrompts({ isElevated: true });

export const formatTokenCount = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};
