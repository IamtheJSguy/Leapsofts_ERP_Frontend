export const AI_STARTER_PROMPTS = [
  'What meetings do I have scheduled this week?',
  'Show me the sales team progress report for this week',
  'Search leads and enrich missing phone, email & company details',
  'Get my profile details and daily KPI summary',
  'Book a meeting — ask me for time and participants',
  'Break down my pipeline by ICP',
  'Show leads in each profile that are accepted but not messaged',
  'Create a kanban card and ask which board and column',
  'Assign a sales KPI template to a teammate',
  'Draft an invoice and wait for me to approve before sending',
];

export const formatTokenCount = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};
