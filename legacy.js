// Compatibility façade for the order-report module.
//
// The implementation has been split into focused modules under ./src with
// descriptive names. This file preserves the original public API (the short
// names q/qa/ql/cnt/fmt/calc/chk/proc/getAll/top/upd) so existing callers
// and the characterization tests keep working unchanged.
//
//   q      -> repository.findById          (single row by id)
//   qa     -> repository.findAll           (all rows in a table)
//   ql     -> repository.findOrderLines    (lines for an order)
//   cnt    -> queryCounter.total           (data-access call count)
//   fmt    -> currency.formatMoney         (currency formatting)
//   calc   -> orderTotal.calculateOrderTotal
//   chk    -> orderValidation.validateOrder
//   proc   -> monthlyReport.buildMonthlyReport
//   getAll -> ordersByStatus.listOrdersByStatus
//   top    -> bestSellers.topProductsByUnits
//   upd    -> orderStatus.updateOrderStatus
const repository = require('./src/repository');
const queryCounter = require('./src/queryCounter');
const { formatMoney } = require('./src/currency');
const { calculateOrderTotal } = require('./src/orderTotal');
const { validateOrder } = require('./src/orderValidation');
const { buildMonthlyReport } = require('./src/monthlyReport');
const { listOrdersByStatus } = require('./src/ordersByStatus');
const { topProductsByUnits } = require('./src/bestSellers');
const { updateOrderStatus } = require('./src/orderStatus');

module.exports = {
  q: repository.findById,
  qa: repository.findAll,
  ql: repository.findOrderLines,
  cnt: queryCounter.total,
  fmt: formatMoney,
  calc: calculateOrderTotal,
  chk: validateOrder,
  proc: buildMonthlyReport,
  getAll: listOrdersByStatus,
  top: topProductsByUnits,
  upd: updateOrderStatus
};
