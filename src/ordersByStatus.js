// Returns all orders with the given status, enriched with customer info
// and per-order line/unit summaries.
const repo = require('./repository');

function listOrdersByStatus(status) {
  const orders = repo.findAll('o');
  const result = [];
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].s == status) {
      const customer = repo.findById('c', orders[i].cid);
      const lines = repo.findOrderLines(orders[i].id);
      let totalQty = 0;
      for (let j = 0; j < lines.length; j++) {
        totalQty = totalQty + lines[j].q;
      }
      result.push({
        id: orders[i].id,
        date: orders[i].dt,
        customer: customer.n,
        city: customer.ct,
        lines: lines.length,
        units: totalQty
      });
    }
  }
  return result;
}

module.exports = { listOrdersByStatus };
