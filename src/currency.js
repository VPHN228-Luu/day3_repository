// Formats a number as US-style currency: "$1,234.50".
// Inserts comma thousands separators into the integer part by hand.
// (Quirk preserved: negative values render as "$-50.00".)
function formatMoney(amount) {
  const fixed = (Math.round(amount * 100) / 100).toFixed(2);
  const parts = fixed.split('.');
  let intWithCommas = '';
  let digitCount = 0;
  for (let i = parts[0].length - 1; i >= 0; i--) {
    intWithCommas = parts[0][i] + intWithCommas;
    digitCount++;
    if (digitCount % 3 === 0 && i > 0) {
      intWithCommas = ',' + intWithCommas;
    }
  }
  return '$' + intWithCommas + '.' + parts[1];
}

module.exports = { formatMoney };
