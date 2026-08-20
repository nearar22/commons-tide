import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAccepted, isTerminal, statusName } from '../src/lib/tx.js';

test('decodes GenLayer terminal statuses', () => {
  assert.equal(statusName(5), 'ACCEPTED');
  assert.equal(statusName(6), 'UNDETERMINED');
  assert.equal(isTerminal('LEADER_TIMEOUT'), true);
});

test('accepts only successful consensus outcomes', () => {
  assert.doesNotThrow(() => assertAccepted({ status: 'FINALIZED' }));
  assert.throws(() => assertAccepted({ status: 'UNDETERMINED' }), /No change was confirmed/);
  assert.throws(() => assertAccepted({ status: 'TIMEOUT' }), /timed out/);
});
