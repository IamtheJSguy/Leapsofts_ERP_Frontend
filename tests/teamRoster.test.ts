import assert from 'node:assert/strict';
import { test } from 'node:test';
import { combineTeamMembers } from '../src/lib/teamRoster.ts';

const manager = { _id: 'manager-a', email: 'a@test.com', role: 'manager' };
const shared = { _id: 'shared', email: 'shared@test.com', role: 'user' };
const team = { _id: 'a', name: 'Alpha', managerId: manager, members: [shared], isActive: true };

test('combined roster counts an employee shared by two teams once and retains both managers', () => {
  const other = { ...team, _id: 'b', managerId: { ...manager, _id: 'manager-b' } };
  const roster = combineTeamMembers([team, other]);
  assert.equal(roster.length, 3);
  assert.equal(roster.filter((member) => member._id === shared._id).length, 1);
});

test('combined directory ignores inactive users, handles no teams, and deduplicates a manager also present in members', () => {
  assert.deepEqual(combineTeamMembers([]), []);
  const roster = combineTeamMembers([{ ...team, members: [manager, { ...shared, isActive: false }] }]);
  assert.deepEqual(roster.map((user) => user._id), [manager._id]);
});
