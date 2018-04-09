const Pool = require('../../index');

/**
 * A promise pool of 5 elements.
 */
const pool = new Pool(5);

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
const process = (idx) => () => new Promise((resolve) => {
  console.log(`Promise ${idx} running ...`);
  resolve(idx);
}).then(onProcessDone);

// Spreading 100 promises execution across the pool,
// delaying their execution by a linearly growing delay.
for (let i = 0; i < 10; ++i) {
  pool.schedule(process(i), (1000 + (100 * i)));
}

// Waiting for all the promises to be executed and
// displaying the results of the promise executions.
pool.all().then((results) => console.log(JSON.stringify(results)));
