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
const promise = (idx) => () => new Promise((resolve) => {
  setImmediate(() => resolve(idx));
});

describe('The promise pool dispatching system', function () {

  beforeEach(function () {
    this.pool = new Pool(5);
  });

  /**
   * Checking whether the promise pool is able to schedule
   * promises.
   */
  it('should be able to schedule promises', function (callback) {
    // Spreading 100 promises execution across the pool.
    for (let i = 0; i < 100; ++i) {
      this.pool.schedule(promise(i));
    }
    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then((results) => evaluateAsPromise(() => results.length.should.equal(100)))
      .then(callback)
      .catch(callback);
  });

  /**
   * Checking whether the promise pool is able to schedule
   * delayed promises.
   */
  it('should be able to schedule delayed promises', function (callback) {
    // Spreading 5 promises execution across the pool.
    for (let i = 0; i < 5; ++i) {
      this.pool.schedule(promise(i), 1000);
    }
    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then((results) => evaluateAsPromise(() => results.length.should.equal(100)))
      .then(callback)
      .catch(callback);
  });

  /**
   * Checking whether the promise pool is able to enqueue
   * promises.
   */
  it('should be able to enqueue promises', function (callback) {
    let p_ = Promise.resolve();

    // Spreading 100 promises execution across the pool.
    for (let i = 0; i < 100; ++i) {
      p_ = p_.then(() => this.pool.enqueue(promise(i)));
    }
    // Waiting for all the promises to be executed.
    p_.then((result) => evaluateAsPromise(() => result.should.equal(99)))
      .then(callback)
      .catch(callback);
  });

  /**
   * Checking whether the promise pool is able to enqueue
   * many promises at the same time.
   */
  it('should be able to enqueue many promises at the same time', function (callback) {
    const expected = JSON.stringify([1, 2, 3]);
    this.pool.enqueueMany([ promise(1), promise(2), promise(3) ])
      .then((results) => evaluateAsPromise(() => JSON.stringify(results).should.equal(expected)))
      .then(callback)
      .catch(callback);
  });

  /**
   * Checking whether the promise pool is able to enqueue
   * many promises on the same executor.
   */
  it('should be able to enqueue many promises on the same executor', function (callback) {
    const expected = JSON.stringify([[1, 2, 3], [4, 5, 6]]);
    // Sequentially enqueuing promises using standard `.then()`.
    Promise.all([
      this.pool.enqueueOnSameExecutor([ promise(1), promise(2), promise(3) ]),
      this.pool.enqueueOnSameExecutor([ promise(4), promise(5), promise(6) ])
    ]).then((results) => evaluateAsPromise(() => JSON.stringify(results).should.equal(expected)))
      .then(callback)
      .catch(callback);
  });
});