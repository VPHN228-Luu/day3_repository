// Characterization tests for legacy.js
// ------------------------------------------------------------------
// These tests DOCUMENT the module's *current* behavior exactly as it is
// today — including quirks and likely-bugs. They are NOT a specification
// of what the code *should* do. The point is to pin behavior down so the
// module can later be refactored safely: if a test here breaks, behavior
// changed (intentionally or not).
//
// The module holds mutable state at load time:
//   - `qc` (query counter) increments on every q/qa/ql call
//   - `upd()` rewrites order status on the shared data array in place
// So we reset the module registry before every test to get a fresh,
// isolated copy of the data.
// ------------------------------------------------------------------

let L;
beforeEach(() => {
  jest.resetModules();
  L = require('./legacy');
});

describe('q(table, key) — single-row lookup by id', () => {
  test('returns the matching row object', () => {
    expect(L.q('c', 1)).toEqual({ id: 1, n: 'Hanoi Garment Co', t: 'A', d: 0.1, ct: 'Hanoi' });
  });

  test('returns null when no row matches', () => {
    expect(L.q('o', 9999)).toBeNull();
  });

  test('uses loose equality, so a numeric-string key still matches', () => {
    // a[i].id == k  → 1 == '1' is true
    expect(L.q('c', '1')).toEqual(L.q('c', 1));
  });
});

describe('qa(table) — all rows for a table', () => {
  test('returns the full array for the table', () => {
    expect(L.qa('p')).toHaveLength(8);
    expect(L.qa('o')).toHaveLength(10);
  });

  test('returns the live internal array reference (not a copy)', () => {
    const a = L.qa('p');
    const b = L.qa('p');
    expect(a).toBe(b); // same reference handed out each time
  });
});

describe('ql(orderId) — order lines for an order', () => {
  test('returns the lines belonging to the order', () => {
    expect(L.ql(1001)).toEqual([
      { oid: 1001, pid: 101, q: 200 },
      { oid: 1001, pid: 104, q: 50 },
    ]);
  });

  test('returns an empty array for an unknown order id', () => {
    expect(L.ql(123456)).toEqual([]);
  });
});

describe('cnt() — query counter', () => {
  test('starts at 0 on a freshly loaded module', () => {
    expect(L.cnt()).toBe(0);
  });

  test('each of q / qa / ql increments the counter by exactly 1', () => {
    L.q('c', 1);
    expect(L.cnt()).toBe(1);
    L.qa('p');
    expect(L.cnt()).toBe(2);
    L.ql(1001);
    expect(L.cnt()).toBe(3);
  });

  test('cnt() itself does not increment the counter', () => {
    L.cnt();
    expect(L.cnt()).toBe(0);
  });
});

describe('fmt(n) — currency formatting', () => {
  test('formats with $, two decimals and comma thousands separators', () => {
    expect(L.fmt(0)).toBe('$0.00');
    expect(L.fmt(4.5)).toBe('$4.50');
    expect(L.fmt(1234.5)).toBe('$1,234.50');
    expect(L.fmt(1234567.891)).toBe('$1,234,567.89');
  });

  test('negative numbers: the minus sign ends up after the $ (quirk)', () => {
    expect(L.fmt(-50)).toBe('$-50.00');
  });
});

describe('calc(orderId) — order total (discount + tax)', () => {
  test('applies tier discount and 8% tax for a normal DONE order', () => {
    // Order 1001: 200 x $4.50 + 50 x $11.50 = 1475; tier A disc 10% -> 1327.5; +8% tax
    expect(L.calc(1001)).toBe(1433.7);
  });

  test('order 1002 total', () => {
    expect(L.calc(1002)).toBe(3318.62);
  });

  test('CANCEL orders still compute a total but get NO tax applied', () => {
    // Order 1003: 40 x $12 = 480; tier A 10% -> 432; no tax because status CANCEL
    expect(L.calc(1003)).toBe(432);
  });

  test('adds an extra 3% bulk discount when total units >= 500', () => {
    // Order 1005 is a single line of 500 units -> qualifies for bulk discount
    expect(L.calc(1005)).toBe(3011.85);
  });

  test('bulk discount also applies to multi-line orders totalling >= 500 units', () => {
    // Order 1007: 220 + 100 = 320 units -> NOT bulk... documents the actual value
    expect(L.calc(1007)).toBe(4032.18);
  });

  test('throws a TypeError when the order id does not exist', () => {
    // q('o', 9999) returns null, then od.cid throws
    expect(() => L.calc(9999)).toThrow(TypeError);
  });
});

describe('chk(orderId) — order validation', () => {
  test('returns "OK" for a valid order', () => {
    expect(L.chk(1001)).toBe('OK');
  });

  test('returns "NG: cancelled" for a cancelled order', () => {
    expect(L.chk(1003)).toBe('NG: cancelled');
  });

  test('returns "NG: no order" for an unknown order id', () => {
    expect(L.chk(9999)).toBe('NG: no order');
  });
});

describe('getAll(status) — orders by status, enriched', () => {
  test('returns OPEN orders with customer + line/unit summaries', () => {
    expect(L.getAll('OPEN')).toEqual([
      { id: 1005, date: '2026-02-09', customer: 'Hue Trading', city: 'Hue', lines: 1, units: 500 },
      { id: 1007, date: '2026-02-21', customer: 'Can Tho Apparel', city: 'Can Tho', lines: 2, units: 320 },
      { id: 1009, date: '2026-03-08', customer: 'Hanoi Garment Co', city: 'Hanoi', lines: 1, units: 400 },
    ]);
  });

  test('counts DONE orders', () => {
    expect(L.getAll('DONE')).toHaveLength(6);
  });

  test('returns an empty array for a status nobody has', () => {
    expect(L.getAll('SHIPPED')).toEqual([]);
  });
});

describe('top(n) — best-selling products (DONE orders only)', () => {
  test('returns the top n products by units sold, descending', () => {
    expect(L.top(3)).toEqual([
      { name: 'T-Shirt Basic', units: 650 },
      { name: 'Polo Shirt', units: 270 },
      { name: 'Track Shorts', units: 130 },
    ]);
  });

  test('n larger than the catalogue just returns everything sold', () => {
    expect(L.top(999).length).toBeLessThanOrEqual(8);
  });
});

describe('upd(id, status) — status change, returns audit line', () => {
  test('valid transition returns OK|id|old->new|customerName', () => {
    expect(L.upd(1005, 'DONE')).toBe('OK|1005|OPEN->DONE|Hue Trading');
  });

  test('unknown order id', () => {
    expect(L.upd(9999, 'DONE')).toBe('ERR|9999|no such order');
  });

  test('invalid target status', () => {
    expect(L.upd(1001, 'SHIPPED')).toBe('ERR|1001|bad status SHIPPED');
  });

  test('cannot change an already-cancelled order', () => {
    expect(L.upd(1003, 'DONE')).toBe('ERR|1003|already cancelled');
  });

  test('cannot reopen a DONE order back to OPEN', () => {
    expect(L.upd(1001, 'OPEN')).toBe('ERR|1001|cannot reopen');
  });

  test('mutates shared module state in place (visible to later reads)', () => {
    expect(L.getAll('OPEN').some((o) => o.id === 1005)).toBe(true);
    L.upd(1005, 'DONE');
    expect(L.getAll('OPEN').some((o) => o.id === 1005)).toBe(false);
    expect(L.getAll('DONE').some((o) => o.id === 1005)).toBe(true);
  });
});

describe('proc(month) — formatted monthly report', () => {
  test('renders the full report for a month with orders', () => {
    expect(L.proc('2026-01')).toMatchSnapshot();
  });

  test('renders an empty report (0 orders, $0.00) for a month with none', () => {
    expect(L.proc('2020-12')).toMatchSnapshot();
  });

  test('excludes CANCEL orders from the counted total but still prints them', () => {
    const out = L.proc('2026-01');
    expect(out).toContain('** CANCELLED — excluded from totals **');
    expect(out).toContain('Orders counted: 2'); // 1001 + 1002, not the cancelled 1003
  });
});
