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

// Enqueuing two promises sequentially.
pool.enqueue(promise(1))
  .then((result) => pool.enqueue(promise(2)))
  .then((result) => {
    console.log(`Execution done with ${result}`);
  });
