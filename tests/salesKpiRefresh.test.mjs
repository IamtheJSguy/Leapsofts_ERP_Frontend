import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/salesKpiRefresh.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function setup() {
  let state = { isAuthenticated: true, user: { _id: 'user-a', organizationId: 'org-a' } };
  const pending = new Map();
  let id = 0;
  const exports = {};
  vm.runInNewContext(code, { exports,
    require: () => ({ useAuthStore: { getState: () => state } }),
    setTimeout: (callback, delay) => { assert.equal(delay, 5000); pending.set(++id, callback); return id; },
    clearTimeout: (timer) => pending.delete(timer),
  });
  const keys = [];
  const client = { invalidateQueries: ({ queryKey }) => { keys.push(queryKey[0]); return Promise.resolve(); } };
  return { exports, client, keys, pending, setState: (value) => { state = value; } };
}
test('completion refresh invalidates KPI totals and dependent dashboards', () => {
  const ctx = setup();
  ctx.exports.refreshSalesKpiQueries(ctx.client);
  assert.deepEqual(ctx.keys.sort(), ['dailyTasks', 'dashboard', 'salesKpiSummary', 'salesKpis', 'salesPipelineStats'].sort());
});
test('fallback coalesces rapid edits and refreshes without a socket', () => {
  const ctx = setup();
  ctx.exports.scheduleSalesKpiRefresh(ctx.client);
  ctx.exports.scheduleSalesKpiRefresh(ctx.client);
  assert.equal(ctx.pending.size, 1);
  [...ctx.pending.values()][0]();
  assert.equal(ctx.keys.length, 5);
});
test('fallback cannot refresh a different organization or logged-out session', () => {
  for (const state of [
    { isAuthenticated: true, user: { _id: 'user-a', organizationId: 'org-b' } },
    { isAuthenticated: true, user: { _id: 'user-b', organizationId: 'org-a' } },
    { isAuthenticated: false, user: null },
  ]) {
    const ctx = setup();
    ctx.exports.scheduleSalesKpiRefresh(ctx.client);
    ctx.setState(state);
    [...ctx.pending.values()][0]();
    assert.equal(ctx.keys.length, 0);
  }
});
