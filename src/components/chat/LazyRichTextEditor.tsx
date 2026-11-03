/**
 * Named for call-site consistency. Editor is bundled with the route that imports it
 * (chat, tasks, kanban, leads) — not the app entry — without a Suspense loader.
 */
export { RichTextEditor as LazyRichTextEditor } from './RichTextEditor';
export type { RichTextEditorProps } from './RichTextEditor';
