const Pool = require('../../index');

/**
 * A promise pool of 5 elements.
 */
const pool = new Pool(5);

/**
 * Generates a random value between `min` and `max`.
 * @return a number between `min` and `max`.
 * @param min the lower number value to generate.
 * @param min the higher number value to generate.
 */
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Process execution of a promise.
 * @param idx the current promise index.
 */
const promise = (idx) => () => new Promise((resolve) => {
  setTimeout(() => {
    console.log(`Promise ${idx} running ...`);
    resolve(idx);
  }, random(0, 1 * 1000));
});

/**
 * Registering lifecycle events on the pool.
 */
pool.on('before.enqueue.each', (e) => {
  console.log(`Enqueued promise on executor ${e.idx}`);
}).on('before.each', (e) => {
  console.log(`About to execute promise with executor (${e.idx})`);
}).on('after.each', (e) => {
  console.log(`Executed promise with executor (${e.idx}) and result ${JSON.stringify(e.result)}`);
}).on('pool.resized', (e) => {
  console.log(`Resized pool to size ${e.size}`);
});

// Resizing the pool to `10` executors.
pool.resize(10);

// Enqueuing two promises sequentially.
pool.enqueueMany([ promise(1), promise(2), promise(3) ]).then(console.log);