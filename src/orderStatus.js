// Updates an order's status and returns a pipe-delimited audit line.
// Allowed statuses: OPEN, DONE, CANCEL. Rejects unknown orders, invalid
// statuses, changes to already-cancelled orders, and DONE->OPEN reopens.
// On success mutates the order in place and returns:
//   OK|<id>|<old>-><new>|<customerName>
const repo = require('./repository');

function updateOrderStatus(orderId, status) {
  const order = repo.findById('o', orderId);
  if (order == null) {
    return 'ERR|' + orderId + '|no such order';
  }
  if (status != 'OPEN' && status != 'DONE' && status != 'CANCEL') {
    return 'ERR|' + orderId + '|bad status ' + status;
  }
  if (order.s == 'CANCEL') {
    return 'ERR|' + orderId + '|already cancelled';
  }
  if (order.s == 'DONE' && status == 'OPEN') {
    return 'ERR|' + orderId + '|cannot reopen';
  }
  const previousStatus = order.s;
  order.s = status;
  const customer = repo.findById('c', order.cid);
  return 'OK|' + orderId + '|' + previousStatus + '->' + status + '|' + customer.n;
}

module.exports = { updateOrderStatus };
