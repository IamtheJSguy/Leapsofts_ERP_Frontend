import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { QueryClient } from '@tanstack/react-query';

const source = readFileSync(new URL('../src/utils/leadUpdateCache.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const scope = { userId: 'user-a', organizationId: 'org-a' };
function setup() {
  let state = { isAuthenticated: true, user: { _id: scope.userId, organizationId: scope.organizationId } };
  const exports = {};
  vm.runInNewContext(code, { exports, require: () => ({ useAuthStore: { getState: () => state } }) });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return { exports, client, setState: (value) => { state = value; } };
}
const oldLead = { _id: 'lead-a', messageStatus: 'not_sent', notes: 'Old note', futureLeadDate: '2026-11-01', updatedAt: '2026-10-08T10:00:00Z' };
const savedLead = { _id: 'lead-a', messageStatus: 'sent', notes: 'Server-normalized note', followUpCount: 1, updatedAt: '2026-10-08T10:01:00Z' };

// Real QueryClient caches and fetch cancellation; no list endpoint is required to render the response.
test('publishes server fields to detail and every existing page immediately, preserving metadata', async () => {
  const ctx = setup();
  const firstKey = ['leads', 'org-a', { page: 1 }];
  const secondKey = ['leads', 'org-a', { messageStatus: 'not_sent', page: 2 }];
  const meta = { page: 1, limit: 20, total: 100 };
  const neighbor = { _id: 'lead-b', messageStatus: 'positive' };
  ctx.client.setQueryData(firstKey, { data: [oldLead, neighbor], meta });
  ctx.client.setQueryData(secondKey, { data: [oldLead], meta: { ...meta, page: 2 } });
  ctx.client.setQueryData(['lead', 'lead-a', 'org-a'], oldLead);
  assert.equal(await ctx.exports.applyLeadUpdateResponse(ctx.client, savedLead, scope), true);
  assert.equal(ctx.client.getQueryData(['lead', 'lead-a', 'org-a']).notes, 'Server-normalized note');
  for (const key of [firstKey, secondKey]) {
    assert.equal(ctx.client.getQueryData(key).data[0].messageStatus, 'sent');
    assert.equal(ctx.client.getQueryData(key).data[0].followUpCount, 1);
    assert.equal(ctx.client.getQueryData(key).data[0].futureLeadDate, undefined);
    assert.equal(ctx.client.getQueryData(key).meta.total, 100);
  }
  assert.equal(ctx.client.getQueryData(firstKey).data[1], neighbor);
  ctx.client.clear();
});

test('does not insert a lead into unrelated filtered pages or another tenant cache', async () => {
  const ctx = setup();
  const filterKey = ['leads', 'org-a', { messageStatus: 'positive' }];
  const foreignKey = ['leads', 'org-b', {}];
  const filterData = { data: [{ _id: 'lead-b' }], meta: { page: 1, limit: 20, total: 1 } };
  const foreignData = { data: [oldLead], meta: { page: 1, limit: 20, total: 1 } };
  ctx.client.setQueryData(filterKey, filterData);
  ctx.client.setQueryData(foreignKey, foreignData);
  await ctx.exports.applyLeadUpdateResponse(ctx.client, savedLead, scope);
  assert.equal(ctx.client.getQueryData(filterKey), filterData);
  assert.equal(ctx.client.getQueryData(foreignKey), foreignData);
  assert.equal(ctx.client.getQueryData(['leads', 'org-a', { page: 999 }]), undefined);
  ctx.client.clear();
});

test('cancels old detail and list fetches so delayed GET responses cannot overwrite the save', async () => {
  const ctx = setup();
  const listKey = ['leads', 'org-a', {}];
  const detailKey = ['lead', 'lead-a', 'org-a'];
  ctx.client.setQueryData(listKey, { data: [oldLead], meta: { page: 1, limit: 20, total: 1 } });
  ctx.client.setQueryData(detailKey, oldLead);
  let resolveList;
  let resolveDetail;
  const listFetch = ctx.client.fetchQuery({ queryKey: listKey, queryFn: () => new Promise((resolve) => { resolveList = resolve; }) }).catch(() => undefined);
  const detailFetch = ctx.client.fetchQuery({ queryKey: detailKey, queryFn: () => new Promise((resolve) => { resolveDetail = resolve; }) }).catch(() => undefined);
  await ctx.exports.applyLeadUpdateResponse(ctx.client, savedLead, scope);
  assert.equal(ctx.client.getQueryData(detailKey).messageStatus, 'sent');
  resolveList({ data: [oldLead], meta: { page: 1, limit: 20, total: 1 } });
  resolveDetail(oldLead);
  await Promise.all([listFetch, detailFetch]);
  assert.equal(ctx.client.getQueryData(detailKey).messageStatus, 'sent');
  assert.equal(ctx.client.getQueryData(listKey).data[0].messageStatus, 'sent');
  ctx.client.clear();
});

test('ignores a response after logout or a user/organization switch', async () => {
  for (const state of [
    { isAuthenticated: false, user: null },
    { isAuthenticated: true, user: { _id: 'user-b', organizationId: 'org-a' } },
    { isAuthenticated: true, user: { _id: 'user-a', organizationId: 'org-b' } },
  ]) {
    const ctx = setup();
    ctx.setState(state);
    assert.equal(await ctx.exports.applyLeadUpdateResponse(ctx.client, savedLead, scope), false);
    assert.equal(ctx.client.getQueryData(['lead', 'lead-a', 'org-a']), undefined);
    ctx.client.clear();
  }
});

test('preserves populated display names while honoring changed IDs and cleared server fields', async () => {
  const ctx = setup();
  const assignee = { _id: 'agent-a', firstName: 'Alice' };
  const shared = { _id: 'agent-b', firstName: 'Bob' };
  ctx.client.setQueryData(['lead', 'lead-a', 'org-a'], { ...oldLead, assignedTo: assignee, sharedWith: [shared] });
  await ctx.exports.applyLeadUpdateResponse(ctx.client, { ...savedLead, assignedTo: 'agent-a', sharedWith: ['agent-b'] }, scope);
  const record = ctx.client.getQueryData(['lead', 'lead-a', 'org-a']);
  assert.equal(record.assignedTo.firstName, 'Alice');
  assert.equal(record.sharedWith[0].firstName, 'Bob');
  assert.equal(record.futureLeadDate, undefined);
  await ctx.exports.applyLeadUpdateResponse(ctx.client, { ...savedLead, assignedTo: 'agent-c', sharedWith: [] }, scope);
  assert.equal(ctx.client.getQueryData(['lead', 'lead-a', 'org-a']).assignedTo, 'agent-c');
  assert.equal(ctx.client.getQueryData(['lead', 'lead-a', 'org-a']).sharedWith.length, 0);
  ctx.client.clear();
});

test('does not overwrite a newer acknowledged update with a slower older PUT response', async () => {
  const ctx = setup();
  const newest = { ...savedLead, notes: 'Newest note', updatedAt: '2026-10-08T10:02:00Z' };
  ctx.client.setQueryData(['lead', 'lead-a', 'org-a'], newest);
  ctx.client.setQueryData(['leads', 'org-a', {}], { data: [newest], meta: { page: 1, limit: 20, total: 1 } });
  await ctx.exports.applyLeadUpdateResponse(ctx.client, savedLead, scope);
  assert.equal(ctx.client.getQueryData(['lead', 'lead-a', 'org-a']).notes, 'Newest note');
  assert.equal(ctx.client.getQueryData(['leads', 'org-a', {}]).data[0].notes, 'Newest note');
  ctx.client.clear();
});

test('uses document revisions to order responses sharing the same timestamp', async () => {
  const ctx = setup();
  ctx.client.setQueryData(['lead', 'lead-a', 'org-a'], { ...savedLead, __v: 3, notes: 'Newest revision' });
  await ctx.exports.applyLeadUpdateResponse(ctx.client, { ...savedLead, __v: 2 }, scope);
  assert.equal(ctx.client.getQueryData(['lead', 'lead-a', 'org-a']).notes, 'Newest revision');
  await ctx.exports.applyLeadUpdateResponse(ctx.client, { ...savedLead, __v: 4, updatedAt: oldLead.updatedAt, notes: 'Next revision' }, scope);
  assert.equal(ctx.client.getQueryData(['lead', 'lead-a', 'org-a']).notes, 'Next revision');
  ctx.client.clear();
});
