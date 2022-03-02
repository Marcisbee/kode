import { test } from 'uvu';
import assert from 'uvu/assert';

import { selectRegion } from './select-region';

test('exports `selectRegion`', () => {
  assert.instance(selectRegion, Function);
});

test('selects whitespace only line', () => {
  const line = '    ';
  const length = line.length;

  assert.equal(selectRegion(line, 0), [0, length]);
  assert.equal(selectRegion(line, 1), [0, length]);
  assert.equal(selectRegion(line, 2), [0, length]);
  assert.equal(selectRegion(line, 3), [0, length]);
  assert.equal(selectRegion(line, 4), [0, length]);
});

test('selects text only line', () => {
  const line = 'text';
  const length = line.length;

  assert.equal(selectRegion(line, 0), [0, length]);
  assert.equal(selectRegion(line, 1), [0, length]);
  assert.equal(selectRegion(line, 2), [0, length]);
});

test('selects symbols only line', () => {
  const line = '()=>{}';
  const length = line.length;

  assert.equal(selectRegion(line, 0), [0, length]);
  assert.equal(selectRegion(line, 1), [0, length]);
  assert.equal(selectRegion(line, 2), [0, length]);
  assert.equal(selectRegion(line, 3), [0, length]);
  assert.equal(selectRegion(line, 4), [0, length]);
});

test('selects text', () => {
  const line = 'fn(';

  assert.equal(selectRegion(line, 0), [0, 2]);
  assert.equal(selectRegion(line, 1), [0, 2]);
  assert.equal(selectRegion(line, 2), [0, 2]);
  assert.equal(selectRegion(line, 3), [2, 3]);
});

test.run();
