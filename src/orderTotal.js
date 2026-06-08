// Computes the final billable total for a single order id.
// Rules (preserved exactly):
//   - sum of line items (unit price x quantity)
//   - minus the customer's tier discount
//   - minus an extra 3% when total quantity >= 500 (bulk)
//   - plus 8% tax, EXCEPT for CANCEL orders (which get no tax)
// Returns a Number rounded to cents.
const repo = require('./repository');

function calculateOrderTotal(orderId) {
  const lines = repo.findOrderLines(orderId);
  let total = 0;
  let totalQty = 0;
  for (let i = 0; i < lines.length; i++) {
    const product = repo.findById('p', lines[i].pid);
    total = total + product.pr * lines[i].q;
    totalQty = totalQty + lines[i].q;
  }
  const order = repo.findById('o', orderId);
  const customer = repo.findById('c', order.cid);
  let discount = customer.d;
  if (totalQty >= 500) {
    discount = discount + 0.03;
  }
  total = total - total * discount;
  if (order.s != 'CANCEL') {
    total = total * 1.08;
  }
  return Math.round(total * 100) / 100;
}

module.exports = { calculateOrderTotal };
