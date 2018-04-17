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
  }, 1 * 1000);
}).then(onProcessDone);

/**
 * Called back before the execution of a promise.
 * @param {*} e an object associated with the event.
 */
const onBeforeEach = (e) => {
  console.log(`[+] Before execution of promise ${e.idx} running on the ${e.strategy == random.strategy ? 'random' : 'load balanced'} strategy`);
};

/**
 * Called back after the execution of a promise.
 * @param {*} e an object associated with the event.
 */
const onAfterEach = (e) => {
  console.log(`[+] After execution of promise ${e.idx} running on the ${e.strategy == random.strategy ? 'random' : 'load balanced'} strategy`);
};

// Subscribing to lifecycle events on the random pool.
random.on('before.each', onBeforeEach).on('after.each', onAfterEach);

// Subscribing to lifecycle events on the load balanced pool.
load.on('before.each', onBeforeEach).on('after.each', onAfterEach);

// Linearly spreading 100 promises execution across both pools.
for (let i = 0; i < 100; ++i) {
  if (i % 2 == 0) {
    random.schedule(promise(i));
  } else {
    load.schedule(promise(i));
  }
}

// Waiting for both pools to finish execution of
// the scheduled promises.
Promise.all([ random.all(), load.all() ]).then(console.log);
