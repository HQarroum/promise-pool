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
   * Checking whether the current strategyis able to schedule
   * promises.
   */
  it('should be able to sequentially schedule promises', function (callback) {
    const expected = JSON.stringify([0, 1, 2, 3, 4, 0, 1, 2, 3, 4]);
    const results_ = JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const array    = [];

    // Storing the order of insertion of promises.
    this.pool.on('before.each', (e) => array.push(e.idx));

    // Spreading `10` promises execution across the pool.
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

  /**
   * Checking whether the current strategyis able to enqueue
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
   * Checking whether the current strategy is able to enqueue
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

  /**
   * Checking whether the strategy is able to upsize the pool
   * dynamically.
   */
  it('should be able to upsize the pool dynamically', function (callback) {
    const beforeEach = [];
    const afterEach  = [];
    const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 1, 2, 3, 4];

    // Registering lifecycle events.
    this.pool.on('before.each', (e) =>
      beforeEach.push(e.idx)).on('after.each', (e) => afterEach.push(e.idx));

    // Resizing the pool.
    this.pool.resize(15);

    // Spreading `20` promises execution across the pool.
    for (let i = 0; i < 20; ++i) {
      this.pool.schedule(promise(i));
    }
    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => (this.pool.opts.size === 15 && this.pool.strategy.pool.length === 15).should.be.true()))
      .then(() => evaluateAsPromise(() => (JSON.stringify(beforeEach) === JSON.stringify(expected)).should.be.true()))
      .then(() => evaluateAsPromise(() => (JSON.stringify(afterEach) === JSON.stringify(expected)).should.be.true()))
      .then(callback)
      .catch(callback);
  });

  /**
   * Checking whether the strategy is able to downsize the pool
   * dynamically.
   */
  it('should be able to downsize the pool dynamically', function (callback) {
    const beforeEach = [];
    const afterEach  = [];
    const expected = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1];

    // Registering lifecycle events.
    this.pool.on('before.each', (e) =>
      beforeEach.push(e.idx)).on('after.each', (e) => afterEach.push(e.idx));
    
    // Resizing the pool.
    this.pool.resize(3);

    // Spreading `20` promises execution across the pool.
    for (let i = 0; i < 20; ++i) {
      this.pool.schedule(promise(i));
    }
    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => (this.pool.opts.size === 3 && this.pool.strategy.pool.length === 3).should.be.true()))
      .then(() => evaluateAsPromise(() => (JSON.stringify(beforeEach) === JSON.stringify(expected)).should.be.true()))
      .then(() => evaluateAsPromise(() => (JSON.stringify(afterEach) === JSON.stringify(expected)).should.be.true()))
      .then(callback)
      .catch(callback);
  });

  /**
   * Checking whether the strategy is able to resize the pool
   * while scheduling new promises.
   */
  it('should be able to resize the pool while scheduling new promises', function (callback) {
    const beforeEach = [];
    const afterEach  = [];
    const expected = [0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,0,1,2,0,1,2,0,1,2,0,1,2,0,1,2,0,1,2,0,1,2,0,1,2,0];

    // Registering lifecycle events.
    this.pool.on('before.each', (e) =>
      beforeEach.push(e.idx)).on('after.each', (e) => afterEach.push(e.idx));

    // Spreading `40` promises execution across the pool.
    for (let i = 0; i < 40; ++i) {
      this.pool.schedule(promise(i));
      if (i === 5) this.pool.resize(10);
      if (i === 15) this.pool.resize(3);
    }

    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => (this.pool.opts.size === 3 && this.pool.strategy.pool.length === 3).should.be.true()))
      .then(() => evaluateAsPromise(() => (JSON.stringify(beforeEach) === JSON.stringify(expected)).should.be.true()))
      .then(() => evaluateAsPromise(() => (JSON.stringify(afterEach) === JSON.stringify(expected)).should.be.true()))
      .then(callback)
      .catch(callback);
  });
});