export const AI_STARTER_PROMPTS = [
  'What meetings do I have scheduled this week?',
  'Show me the sales team progress report for this week',
  'Search leads and enrich missing phone, email & company details',
  'Get my profile details and daily KPI summary',
  'Book a meeting — ask me for time and participants',
];

export const formatTokenCount = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};
