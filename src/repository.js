// Data-access layer over the in-memory database.
// Every read records a hit on the query counter (matching the original
// behavior where q/qa/ql each bumped the global counter).
//
// NOTE: loose equality (==) is preserved intentionally so callers passing
// numeric-string keys keep matching, exactly as before.
const db = require('./database');
const counter = require('./queryCounter');

// Find a single row in `table` by its id. Returns null when not found.
function findById(table, id) {
  counter.record();
  const rows = db[table];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].id == id) {
      return rows[i];
    }
  }
  return null;
}

// Return the live array of all rows in `table` (not a copy).
function findAll(table) {
  counter.record();
  return db[table];
}

// Return all order-line rows belonging to `orderId`.
function findOrderLines(orderId) {
  counter.record();
  const result = [];
  for (let i = 0; i < db.l.length; i++) {
    if (db.l[i].oid == orderId) {
      result.push(db.l[i]);
    }
  }
  return result;
}

module.exports = { findById, findAll, findOrderLines };
