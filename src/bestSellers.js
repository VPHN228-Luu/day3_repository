// Returns the top `limit` products by total units sold, counting DONE
// orders only, sorted by units descending. Products are keyed by name.
const repo = require('./repository');

function topProductsByUnits(limit) {
  const orders = repo.findAll('o');
  const unitsByProduct = {};
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].s != 'DONE') {
      continue;
    }
    const lines = repo.findOrderLines(orders[i].id);
    for (let j = 0; j < lines.length; j++) {
      const product = repo.findById('p', lines[j].pid);
      if (unitsByProduct[product.n] == undefined) {
        unitsByProduct[product.n] = 0;
      }
      unitsByProduct[product.n] = unitsByProduct[product.n] + lines[j].q;
    }
  }
  const ranked = [];
  for (const name in unitsByProduct) {
    ranked.push({ name: name, units: unitsByProduct[name] });
  }
  ranked.sort(function (a, b) {
    return b.units - a.units;
  });
  const result = [];
  for (let i = 0; i < ranked.length && i < limit; i++) {
    result.push(ranked[i]);
  }
  return result;
}

module.exports = { topProductsByUnits };
