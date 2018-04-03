const Pool = require('../../index');

/**
 * A promise pool of 5 elements.
 */
const pool = new Pool({ size: 5, strategy: 'load-balancer' });

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
const onProcessDone = (result) => {
  console.log(`Promise successfully executed with result ${result} !`);
};

/**
 * Process execution of a promise.
 * @param idx the current promise index.
 */
const process = (idx) => () => new Promise((resolve) => {
  const time = random(0, 1 * 1000);
  setTimeout(() => {
    console.log(`Promise ${idx} running ...`);
    resolve(time);
  }, time);
});

/**
 * Subscribing to lifecycle events on the pool.
 */
pool.beforeEach((idx) => {
  console.log(`[+] Before execution of promise ${idx}`);
}).afterEach((idx) => {
  console.log(`[+] After execution of promise ${idx}`);
});

// Spreading 100 promises execution across the pool.
for (let i = 0; i < 10; ++i) {
  pool.enqueue(process(i)).then(onProcessDone);
}

// Waiting for the execution of all promises in the pool.
pool.all().then(() => {
  console.log('[+] All promises have been executed');
});
