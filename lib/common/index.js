/**
 * Executes the given `callback` function `n` times.
 * @param n the number of times to execute the loop.
 * @param callback the callback to call on each iteration.
 */
exports.times = (n, callback) => {
  for (let i = 0; i < n; ++i) callback(i);
};

/**
 * Generates a random value between `min` and `max`.
 * @return a number between `min` and `max`.
 * @param min the lower number value to generate.
 * @param min the higher number value to generate.
 */
exports.random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
