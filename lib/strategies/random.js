const Strategy = require('../strategy');

/**
 * Generates a random value between `min` and `max`.
 * @return a number between `min` and `max`.
 * @param min the lower number value to generate.
 * @param min the higher number value to generate.
 */
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * The `RandomStrategy` randomly balances the
 * execution of promises within the promise pool.
 */
class RandomStrategy extends Strategy {

  /**
   * `RandomStrategy` constructor.
   * @param {*} opts options associated with the
   * promise pool
   */
  constructor(opts) {
    super(opts);
    this.pool = [];
    // Creating `opts.size` resolved promises.
    for (let i = 0; i < opts.size; ++i) {
      this.pool[i] = Promise.resolve();
    }
  }

  /**
   * Obtains a new index from the promise pool array on which
   * to enqueue the execution of a promise.
   * @return an index to the promise to use within
   * the pool.
   */
  obtainIndex() {
    return (random(0, this.pool.length - 1));
  }

  /**
   * Enqueues the given callable on the promise located
   * at the given index in the promise pool.
   * @param {*} f the function to enqueue.
   * @param {*} idx the index of the promise on which this
   * method will enqueue the given function.
   */
  __enqueue(f, idx) {
    return (this.pool[idx] = this.pool[idx].then(f));
  }

  /**
   * Enqueues the given callable along with its associated
   * hooks on the promise located at the given index in the
   * promise pool.
   * @param {*} f the function to enqueue.
   * @param {*} idx the index of the promise on which this
   * method will enqueue the given function.
   */
  enqueueCallableAt(f, idx) {
    let p_ = null;

    if (idx > this.pool.length - 1) {
      throw new Error('Index is out of bounds');
    }
    // Enqueue the `beforeEach` hook.
    if (this.hooks.beforeEach) {
      p_ = this.__enqueue(this.__wrapHook(idx, 'beforeEach'), idx);
    }
    // Enqueue the given function.
    p_ = this.__enqueue(f, idx);
    // Enqueue the `afterEach` hook.
    if (this.hooks.afterEach) {
      p_ = this.__enqueue(this.__wrapHook(idx, 'afterEach'), idx);
    }
    return (p_);
  }

  /**
   * Allows the execution of an array of promises
   * on the same promise executor.
   * @param {*} array an array of promises to execute.
   */
  enqueueOnSameExecutor(array) {
    let p_ = null;
    array.forEach((f) => p_ = this.enqueueCallableAt(f, this.obtainIndex()));
    return (p_);
  }

  /**
   * Schedules the execution of a function by balancing it
   * throughout the promise pool.
   * @param {*} f the function to execute.
   * @return a reference to the `.then()` result associated
   * with the promise which is going to execute the given
   * function.
   */
  enqueue(f) {
    return (this.enqueueCallableAt(f, this.obtainIndex()));
  }

  /**
   * @return a promise randomly selected from the internal
   * promise pool.
   */
  promise() {
    return (this.pool[this.obtainIndex()]);
  }
}

module.exports = RandomStrategy;