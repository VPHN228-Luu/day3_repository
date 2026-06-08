// Builds the formatted plain-text monthly order report for a month
// given as 'YYYY-MM'. Lists each order in that month with its lines,
// shows discounted+taxed totals for non-cancelled orders, prints
// cancelled orders but excludes them from the counted grand total.
const repo = require('./repository');
const { formatMoney } = require('./currency');
const { calculateOrderTotal } = require('./orderTotal');

function buildMonthlyReport(month) {
  const orders = repo.findAll('o');
  let report = '';
  report = report + '==========================================\n';
  report = report + ' MONTHLY ORDER REPORT  ' + month + '\n';
  report = report + '==========================================\n';
  let grandTotal = 0;
  let countedOrders = 0;
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    if (order.dt.substring(0, 7) != month) {
      continue;
    }
    const customer = repo.findById('c', order.cid);
    const lines = repo.findOrderLines(order.id);
    report = report + '\nOrder #' + order.id + '  [' + order.s + ']  ' + order.dt + '\n';
    report = report + '  Customer: ' + customer.n + ' (' + customer.ct + ', tier ' + customer.t + ')\n';
    let subtotal = 0;
    for (let j = 0; j < lines.length; j++) {
      const product = repo.findById('p', lines[j].pid);
      const lineTotal = product.pr * lines[j].q;
      subtotal = subtotal + lineTotal;
      report = report + '    ' + product.n + '  x' + lines[j].q + '  @ ' + formatMoney(product.pr) + '  = ' + formatMoney(lineTotal) + '\n';
    }
    if (order.s != 'CANCEL') {
      const total = calculateOrderTotal(order.id);
      report = report + '  Subtotal: ' + formatMoney(subtotal) + '   Total(incl. disc+tax): ' + formatMoney(total) + '\n';
      grandTotal = grandTotal + total;
      countedOrders = countedOrders + 1;
    } else {
      report = report + '  ** CANCELLED — excluded from totals **\n';
    }
  }
  report = report + '\n------------------------------------------\n';
  report = report + ' Orders counted: ' + countedOrders + '\n';
  report = report + ' Grand total:    ' + formatMoney(grandTotal) + '\n';
  report = report + '==========================================\n';
  return report;
}

module.exports = { buildMonthlyReport };
