const _       = require('lodash');
const should  = require('should');
const Pool    = require('../');

/**
 * @return a promise resolved if the given function does not
 * throw an exception, or rejected if the given function does
 * throw an exception.
 * @param {*} f the function to call.
 */
const evaluateAsPromise = (f) => new Promise((resolve, reject) => {
  try { f(); } catch (e) { return reject(e); }
  resolve();
});

/**
 * Process execution of a promise.
 * @param idx the current promise index.
 */
const promise = (idx) => () => new Promise((resolve) => {
  setImmediate(() => resolve(idx));
});

/**
 * @return the entropy of the given array.
 */
const entropy = (array) => {
  let entropy_ = 0;
  for (let i = 0; i + 1 < array.length; ++i) {
    entropy_ += Math.abs(array[i] - array[i + 1]);
  }
  return (entropy_);
};

describe('The random strategy', function () {

  beforeEach(function () {
    this.pool = new Pool({
      size: 50,
      strategy: 'random'
    });
  });

  /**
   * Checking whether the promise pool is able to schedule
   * promises.
   */
  it('should be able to randomly schedule promises', function (callback) {
    const input    = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const results_ = JSON.stringify(input);
    const array    = [];
    
    // Storing the order of insertion of promises.
    this.pool.beforeEach((idx) => array.push(idx));
    // Spreading 100 promises execution across the pool.
    for (let i = 0; i < 10; ++i) {
      this.pool.schedule(promise(i));
    }
    // Waiting for all promises to be executed.
    this.pool.all()
      .then((results) => evaluateAsPromise(() => JSON.stringify(results).should.equal(results_)))
      .then(() => evaluateAsPromise(() => should(entropy(input) < entropy(array)).be.true()))
      .then(callback)
      .catch(callback);
  });
});