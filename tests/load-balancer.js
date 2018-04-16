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
const promise = (idx) => () => new Promise((resolve) => setImmediate(() => resolve(idx)));

describe('The load balancer strategy', function () {

  beforeEach(function () {
    this.pool = new Pool({
      size: 10,
      strategy: 'load-balancer'
    });
  });

  /**
   * Checking whether the promise pool is able to schedule
   * promises.
   */
  it('should be able to randomly schedule promises', function (callback) {
    const expected = JSON.stringify([0, 9, 1, 3, 7, 8, 4, 2, 5, 6, 0, 9, 1, 3, 7, 8, 4, 2, 5, 6]);
    const results_ = JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    const array    = [];
    
    // Setting the timeout value to `20000` milliseconds.
    this.timeout(20000);
    // Storing the order of insertion of promises.
    this.pool.beforeEach((idx) => array.push(idx));
    // Spreading 100 promises execution across the pool.
    for (let i = 0; i < 20; ++i) {
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
   * Checking whether the strategy is able to upsize the pool
   * dynamically.
   */
  it('should be able to upsize the pool dynamically', function (callback) {
    const beforeEach = [];
    const afterEach  = [];
    const expected   = [0, 14, 1, 3, 7, 8, 4, 9, 10, 2, 5, 11, 12, 6, 13, 0, 1, 4, 6, 13];

    // Setting the timeout value to `20000` milliseconds.
    this.timeout(20000);
    // Registering lifecycle events.
    this.pool.beforeEach((idx) => beforeEach.push(idx)).afterEach((idx) => afterEach.push(idx));
    // Resizing the pool.
    this.pool.resize(15);
    // Spreading `20` promises execution across the pool.
    for (let i = 0; i < 20; ++i) {
      this.pool.schedule(promise(i));
    }
    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => (this.pool.opts.size === 15 && this.pool.strategy.pool.array.length === 15).should.be.true()))
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
    const expected   = [5, 4, 1, 3, 2, 5, 4, 1, 3, 2, 5, 4, 1, 3, 2, 5, 4, 1, 3, 2];

    // Setting the timeout value to `20000` milliseconds.
    this.timeout(20000);
    // Registering lifecycle events.
    this.pool.beforeEach((idx) => beforeEach.push(idx)).afterEach((idx) => afterEach.push(idx));
    // Resizing the pool.
    this.pool.resize(5);
    // Spreading `20` promises execution across the pool.
    for (let i = 0; i < 20; ++i) {
      this.pool.schedule(promise(i));
    }
    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => (this.pool.opts.size === 5 && this.pool.strategy.pool.array.length === 5).should.be.true()))
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
    const expected   = [0,9,1,3,7,8,4,2,5,6,0,9,1,7,5,6,0,7,5,0,7,5,0,7,5,0,7,5,0,7,5,0,7,5,0,7,5,0,7,5];

    // Registering lifecycle events.
    this.pool.beforeEach((idx) => beforeEach.push(idx)).afterEach((idx) => afterEach.push(idx));
    // Spreading `40` promises execution across the pool.
    for (let i = 0; i < 40; ++i) {
      this.pool.schedule(promise(i));
      if (i === 5) this.pool.resize(10);
      if (i === 15) this.pool.resize(3);
    }
    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => (this.pool.opts.size === 3 && this.pool.strategy.pool.array.length === 3).should.be.true()))
      .then(() => evaluateAsPromise(() => (JSON.stringify(beforeEach) === JSON.stringify(expected)).should.be.true()))
      .then(() => evaluateAsPromise(() => (JSON.stringify(afterEach) === JSON.stringify(expected)).should.be.true()))
      .then(callback)
      .catch(callback);
  });
});