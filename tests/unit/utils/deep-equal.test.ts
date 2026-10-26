import { describe, it, expect } from 'vitest';
import { deepEqualIgnoringKeyOrder } from '../../../src/utils/deep-equal.js';

describe('deepEqualIgnoringKeyOrder', () => {
  it('ignores top-level key order', () => {
    expect(deepEqualIgnoringKeyOrder({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it('ignores nested key order', () => {
    expect(
      deepEqualIgnoringKeyOrder({ env: { A: '1', B: '2' }, cmd: 'x' }, { cmd: 'x', env: { B: '2', A: '1' } }),
    ).toBe(true);
  });

  it('ignores key order of objects inside arrays', () => {
    expect(deepEqualIgnoringKeyOrder([{ a: 1, b: 2 }], [{ b: 2, a: 1 }])).toBe(true);
  });

  it('treats array order as significant', () => {
    expect(deepEqualIgnoringKeyOrder(['-y', 'pkg'], ['pkg', '-y'])).toBe(false);
  });

  it('detects missing, extra, and changed keys', () => {
    expect(deepEqualIgnoringKeyOrder({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqualIgnoringKeyOrder({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    expect(deepEqualIgnoringKeyOrder({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('does not equate arrays with objects or differing primitive types', () => {
    expect(deepEqualIgnoringKeyOrder([], {})).toBe(false);
    expect(deepEqualIgnoringKeyOrder('1', 1)).toBe(false);
    expect(deepEqualIgnoringKeyOrder(null, {})).toBe(false);
  });

  it('compares dates by value', () => {
    expect(deepEqualIgnoringKeyOrder(new Date(0), new Date(0))).toBe(true);
    expect(deepEqualIgnoringKeyOrder(new Date(0), new Date(1))).toBe(false);
  });
});
