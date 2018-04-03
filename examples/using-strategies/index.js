const Pool = require('../../index');

/**
 * Creating a first promise pool based on
 * the `random` strategy.
 */
const random = new Pool({
  size: 50,
  strategy: 'random'
});

/**
 * Creating a second promise pool based on
 * the `load-balanced` strategy.
 */
const load = new Pool({
  size: 50,
  strategy: 'load-balancer'
});

/**
 * Called back when a promise has been successfully
 * executed.
 * @param idx the executed promise index.
 */
const onProcessDone = (idx) => {
  console.log(`Promise ${idx} successfully executed !`);
};

/**
 * Process execution of a promise.
 * @param idx the current promise index.
 */
const process = (idx) => () => new Promise((resolve) => {
  setTimeout(() => {
    console.log(`Promise ${idx} running ...`);
    resolve(idx);
  }, 1 * 1000);
}).then(onProcessDone);

/**
 * Called back before the execution of a promise.
 * @param {*} idx the index of the promise in the pool.
 * @param {*} pool a reference to the pool executing the promise.
 */
const onBeforeEach = (idx, pool) => {
  console.log(`[+] Before execution of promise ${idx} running on the ${pool == random ? 'random' : 'load balanced'} pool`);
};

/**
 * Called back after the execution of a promise.
 * @param {*} idx the index of the promise in the pool.
 * @param {*} pool a reference to the pool executing the promise.
 */
const onAfterEach = (idx, pool) => {
  console.log(`[+] After execution of promise ${idx} running on the ${pool == random ? 'random' : 'load balanced'} pool`);
};

// Subscribing to lifecycle events on the random pool.
random.beforeEach(onBeforeEach).afterEach(onAfterEach);

// Subscribing to lifecycle events on the load balanced pool.
load.beforeEach(onBeforeEach).afterEach(onAfterEach);

// Linearly spreading 100 promises execution across both pools.
for (let i = 0; i < 100; ++i) {
  if (i % 2 == 0) {
    random.schedule(process(i));
  } else {
    load.schedule(process(i));
  }
}
