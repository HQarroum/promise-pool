const Strategy = require('../strategy');

/**
 * The `RoundRobinStrategy` sequentially balances the
 * execution of promises within the promise pool.
 */
class RoundRobinStrategy extends Strategy {

  /**
   * `RoundRobinStrategy` constructor.
   * @param {*} opts options associated with the
   * promise pool.
   */
  constructor(opts) {
    super(opts);
    this.pool  = [];
    this.index = 0;
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
    return (this.index++ % this.pool.length);
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
      p_ = this.__enqueue(this.__wrapHook(idx, 'afterEach', this.__currentTime()), idx);
    }
    return (p_);
  }

  /**
   * Allows the execution of an array of promises
   * on the same promise executor.
   * @param {*} array an array of promises to execute.
   */
  enqueueOnSameExecutor(array) {
    const idx = this.obtainIndex();
    const promises = [];
    array.forEach((f) => promises.push(this.enqueueCallableAt(f, idx)));
    return (Promise.all(promises));
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
   * @return a promise resolved when all promises in the
   * pool have been resolved.
   */
  all() {
    const results  = [];
    const callback = (_1, _2, result, insertedAt) => results.push({ result, insertedAt });

    // Intercepting promise results until all promises
    // have been resolved.
    this.afterEach(callback);
    // Sorting the result array by inserted time.
    return Promise.all(this.pool).then(() => {
      this.removeAfterEach(callback);
      return (
        Promise.resolve(results
          .sort((a, b) => a.insertedAt - b.insertedAt)
          .map((entry) => entry.result))
      );
    });
  }
}

module.exports = RoundRobinStrategy;