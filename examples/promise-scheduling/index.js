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
 * Called back when a promise has been successfully
 * executed.
 * @param idx the executed promise index.
 */
const onProcessDone = (idx) => {
  console.log(`Promise ${idx} successfully executed !`);
  return (Promise.resolve(idx));
};

/**
 * Process execution of a promise.
 * @param idx the current promise index.
 */
const promise = (idx) => () => new Promise((resolve) => {
  setTimeout(() => {
    console.log(`Promise ${idx} running ...`);
    resolve(idx);
  }, random(0, 1 * 1000));
}).then(onProcessDone);

/**
 * Subscribing to lifecycle events on the pool.
 */
pool.on('before.each', (e) => {
  console.log(`[+] Before execution of promise ${e.idx}`);
}).on('after.each', (e) => {
  console.log(`[+] After execution of promise ${e.idx}`);
});

// Spreading 100 promises execution across the pool.
for (let i = 0; i < 100; ++i) {
  pool.schedule(promise(i));
}

// Waiting for all the promises to be executed and
// displaying the results of the promise executions.
pool.all().then((results) => console.log(JSON.stringify(results)));
