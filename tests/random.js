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

/**
 * @return a the index of the value higher than `maxValue`
 * contained in the given `array` if found between `startIndex`
 * and `stopIndex`, zero otherwise.
 * @param {*} array the array to search for a value higher than `maxValue`.
 * @param {*} begin the start value at which to begin the lookup.
 * @param {*} end the end value at which to end the lookup.
 * @param {*} maxValue the maximum value an integer in the array should have.
 */
const enforceMaxValue = (array, begin, end, maxValue) => {
  for (let i = begin; i < end; ++i) {
    if (array[i] > maxValue) {
      return (i);
    }
  }
  return (0);
};

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
   * Checking whether the current strategy is able to schedule
   * promises.
   */
  it('should be able to randomly schedule promises', function (callback) {
    const input    = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const results_ = JSON.stringify(input);
    const array    = [];
    
    // Storing the order of insertion of promises.
    this.pool.on('before.each', (e) => array.push(e.idx));

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
   * Checking whether the strategy is able to upsize the pool
   * dynamically.
   */
  it('should be able to upsize the pool dynamically', function (callback) {
    const beforeEach = [];
    const afterEach  = [];

    // Registering lifecycle events.
    this.pool.on('before.each', (e) =>
      beforeEach.push(e.idx)).on('after.each', (e) => afterEach.push(e.idx));
    
    // Resizing the pool.
    this.pool.resize(60);

    // Spreading `100` promises execution across the pool.
    for (let i = 0; i < 100; ++i) {
      this.pool.schedule(promise(i));
    }

    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => (this.pool.opts.size === 60 && this.pool.strategy.pool.length === 60).should.be.true()))
      .then(() => new Promise((resolve, reject) => {
        beforeEach.forEach((e) => {
          if (e > 59) {
            reject(new Error('An index in the pool is higher than the maximum possible index'));
          }
        });
        resolve();
      }))
      .then(() => evaluateAsPromise(() => (JSON.stringify(beforeEach) === JSON.stringify(afterEach)).should.be.true()))
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

    // Registering lifecycle events.
    this.pool.on('before.each', (e) =>
      beforeEach.push(e.idx)).on('after.each', (e) => afterEach.push(e.idx));
    
    // Resizing the pool.
    this.pool.resize(10);

    // Spreading `20` promises execution across the pool.
    for (let i = 0; i < 20; ++i) {
      this.pool.schedule(promise(i));
    }
    
    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => (this.pool.opts.size === 10 && this.pool.strategy.pool.length === 10).should.be.true()))
      .then(() => new Promise((resolve, reject) => {
        beforeEach.forEach((e) => {
          if (e > 9) {
            reject(new Error('An index in the pool is higher than the maximum possible index'));
          }
        });
        resolve();
      }))
      .then(() => evaluateAsPromise(() => (JSON.stringify(beforeEach) === JSON.stringify(afterEach)).should.be.true()))
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

    // Registering lifecycle events.
    this.pool.on('before.enqueue.each', (e) =>
      beforeEach.push(e.idx)).on('after.enqueue.each', (e) => afterEach.push(e.idx));
    
    // Spreading `1000` promises execution across the pool.
    for (let i = 0; i < 1000; ++i) {
      if (i >= 0 && i < 50) {
        this.pool.resize(60);
        this.pool.schedule(promise(i));
        if (enforceMaxValue(beforeEach, 0, 49, 59)) {
          return (callback(new Error('An index in the pool is higher than the maximum possible index')));
        }
      }
      if (i >= 50) {
        this.pool.resize(10);
        this.pool.schedule(promise(i));
        if (enforceMaxValue(beforeEach, 50, 999, 9)) {
          return (callback(new Error('An index in the pool is higher than the maximum possible index')));
        }
      }
    }
    // Waiting for all the promises to be executed and
    // displaying the results of the promise executions.
    this.pool.all()
      .then(() => evaluateAsPromise(() => (this.pool.opts.size === 10 && this.pool.strategy.pool.length === 10).should.be.true()))
      .then(() => evaluateAsPromise(() => (JSON.stringify(beforeEach) === JSON.stringify(afterEach)).should.be.true()))
      .then(callback)
      .catch(callback);
  });
});