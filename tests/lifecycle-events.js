const _          = require('lodash');
const should     = require('should');
const Pool       = require('../');
const RoundRobin = require('../lib/strategies/round-robin');

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

describe('The promise pool events system', function () {

  beforeEach(function () {
    this.pool = new Pool(10);
  });

  /**
   * Checking whether the promise pool is able to signal
   * execution events.
   */
  it('should be able to signal execution events', function (callback) {
    const beforeEach = [];
    const afterEach  = [];
    const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Registering lifecycle events.
    this.pool.beforeEach((idx) => beforeEach.push(idx)).afterEach((idx) => afterEach.push(idx));

    // Spreading 100 promises execution across the pool.
    for (let i = 0; i < 10; ++i) {
      this.pool.schedule(promise(i));
    }
    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => (JSON.stringify(beforeEach) === JSON.stringify(expected)).should.be.true()))
      .then(() => evaluateAsPromise(() => (JSON.stringify(afterEach) === JSON.stringify(expected)).should.be.true()))
      .then(callback)
      .catch(callback);
  });

  /**
   * Checking whether the promise pool is able to signal
   * enqueueing events.
   */
  it('should be able to signal enqueueing events', function (callback) {
    const beforeEach = [];
    const afterEach  = [];
    const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Registering lifecycle events.
    this.pool.beforeEnqueueEach((idx) => beforeEach.push(idx)).afterEnqueueEach((idx) => afterEach.push(idx));

    // Spreading 100 promises execution across the pool.
    for (let i = 0; i < 10; ++i) {
      this.pool.schedule(promise(i));
    }
    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => (JSON.stringify(beforeEach) === JSON.stringify(expected)).should.be.true()))
      .then(() => evaluateAsPromise(() => (JSON.stringify(afterEach) === JSON.stringify(expected)).should.be.true()))
      .then(callback)
      .catch(callback);
  });

  /**
   * Checking whether the promise pool is able to provide
   * the right arguments to event handlers.
   */
  it('should be able to provide the right arguments to event handlers', function (callback) {
    let count = 0;

    // Registering lifecycle events.
    this.pool.beforeEach((idx, strategy, result) => {
      if (Number.isInteger(idx) && strategy instanceof RoundRobin && !result) {
        count++;
      }
    }).afterEach((idx, strategy, result, insertedAt) => {
      if (Number.isInteger(idx) && strategy instanceof RoundRobin && result === idx && Number.isInteger(insertedAt)) {
        count++;
      }
    });

    // Spreading 100 promises execution across the pool.
    for (let i = 0; i < 10; ++i) {
      this.pool.schedule(promise(i));
    }

    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => count.should.be.equal(20)))
      .then(callback)
      .catch(callback);
  });

  /**
   * Checking whether the promise pool is able to unregister
   * lifecycle event handlers.
   */
  it('should be able to unregister lifecycle event handlers', function (callback) {
    let count = 0;

    // Event handler counting calls.
    const handler = () => count++;

    // Registering lifecycle events.
    this.pool
      .beforeEach(handler)
      .beforeEnqueueEach(handler)
      .afterEach(handler)
      .afterEnqueueEach(handler)
      .removeBeforeEach(handler)
      .removeBeforeEnqueueEach(handler)
      .removeAfterEach(handler)
      .removeAfterEnqueueEach(handler);

    // Spreading 100 promises execution across the pool.
    for (let i = 0; i < 10; ++i) {
      this.pool.schedule(promise(i));
    }

    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => count.should.be.equal(0)))
      .then(callback)
      .catch(callback);
  });
});