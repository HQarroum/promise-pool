const _      = require('lodash');
const should = require('should');
const Pool   = require('../');

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
const promise = (idx) => () => new Promise((resolve) => setImmediate(() => resolve(idx)));

describe('The round robin strategy', function () {

  beforeEach(function () {
    this.pool = new Pool({
      size: 5,
      strategy: 'round-robin'
    });
  });

  /**
   * Checking whether the promise pool is able to schedule
   * promises.
   */
  it('should be able to sequentially schedule promises', function (callback) {
    const expected = JSON.stringify([0, 1, 2, 3, 4, 0, 1, 2, 3, 4]);
    const results_ = JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
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
      .then(() => evaluateAsPromise(() => JSON.stringify(array).should.equal(expected)))
      .then(callback)
      .catch(callback);
  });
});