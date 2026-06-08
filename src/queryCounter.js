// Tracks how many data-access calls have been made.
// Module-level state is intentional: it preserves the original global
// "query counter" behavior (a single tally for the lifetime of the module).
let count = 0;

function record() {
  count += 1;
}

function total() {
  return count;
}

module.exports = { record, total };
