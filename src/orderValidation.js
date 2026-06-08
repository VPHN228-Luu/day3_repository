// Validates an order id, returning 'OK' or a human-readable 'NG: ...' reason.
// Checks: order exists, not cancelled, has lines, and every line references
// a real product with a positive quantity that is within available stock.
const repo = require('./repository');

function validateOrder(orderId) {
  const order = repo.findById('o', orderId);
  if (order == null) {
    return 'NG: no order';
  }
  if (order.s == 'CANCEL') {
    return 'NG: cancelled';
  }
  const lines = repo.findOrderLines(orderId);
  if (lines.length == 0) {
    return 'NG: empty';
  }
  for (let i = 0; i < lines.length; i++) {
    const product = repo.findById('p', lines[i].pid);
    if (product == null) {
      return 'NG: bad product ' + lines[i].pid;
    }
    if (lines[i].q <= 0) {
      return 'NG: bad qty';
    }
    if (lines[i].q > product.st) {
      return 'NG: not enough stock for ' + product.n;
    }
  }
  return 'OK';
}

module.exports = { validateOrder };
