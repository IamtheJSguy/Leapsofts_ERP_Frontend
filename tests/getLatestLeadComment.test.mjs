import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getLatestLeadComment, leadHasComment } from '../src/utils/getLatestLeadComment.ts';

describe('getLatestLeadComment', () => {
  it('returns newest leadComments entry by updatedAt', () => {
    const latest = getLatestLeadComment({
      leadComments: [
        { text: 'old', level: 'yellow', updatedAt: '2024-01-01T00:00:00.000Z' },
        { text: 'new', level: 'red', updatedAt: '2025-01-01T00:00:00.000Z' },
      ],
    });
    assert.equal(latest?.text, 'new');
  });

  it('falls back to legacy leadComment', () => {
    const latest = getLatestLeadComment({
      leadComment: { text: 'legacy', level: 'green' },
    });
    assert.equal(latest?.text, 'legacy');
  });

  it('leadHasComment detects any source', () => {
    assert.equal(leadHasComment({ leadComments: [{ text: 'x', level: 'yellow' }] }), true);
    assert.equal(leadHasComment({ leadComment: { text: 'y', level: 'yellow' } }), true);
    assert.equal(leadHasComment({}), false);
  });
});
