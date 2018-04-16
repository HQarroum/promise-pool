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
   * Private method that will realign the internal
   * index, with the new pool size.
   * @param {*} size the new size of the pool.
   * @return the new value of the index.
   */
  __realignIndex(size) {
    let index      = this.index;
    const expected = index % this.pool.length;
    
    if (expected > size - 1) {
      // The value is too high to be reached.
      return (0);
    }
    while (index % size != expected) index++;
    return (index);
  }

  /**
   * Resizes the internal promise pool with the given `size`.
   * @param {*} size the new size of the promise pool.
   * @return a reference to the current strategy.
   */
  resize(size) {
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error('Size should be a positive integer');
    }
    if (size > this.pool.length) {
      this.index = this.__realignIndex(size);
      while (size > this.pool.length) {
        this.pool.push(Promise.resolve());
      }
    } else if (size < this.pool.length) {
      this.index = this.__realignIndex(size);
      this.pool.splice(size, this.pool.length - size);
    }
    this.opts.size = size;
    return (this);
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
  enqueueCallableAt(f, idx, delay) {
    let p_ = null;

    if (idx > this.pool.length - 1) {
      throw new Error('Index is out of bounds');
    }
    // Calling the `beforeEnqueueEach` hooks.
    this.__wrapHook(idx, 'beforeEnqueueEach')(f);
    // Enqueue the `beforeEach` hook.
    p_ = this.__enqueue(this.__wrapHook(idx, 'beforeEach'), idx);
    // Enqueue the given function.
    p_ = this.__enqueue(this.__wrapDelay(f, delay), idx);
    // Enqueue the `afterEach` hook.
    p_ = this.__enqueue(this.__wrapHook(idx, 'afterEach', this.__currentTime()), idx);
    // Calling the `afterEnqueueEach` hooks.
    this.__wrapHook(idx, 'afterEnqueueEach')(f);
    return (p_);
  }

  /**
   * Allows the execution of an array of promises
   * on the same promise executor.
   * @param {*} array an array of promises to execute.
   */
  enqueueOnSameExecutor(array, delay) {
    const idx = this.obtainIndex();
    const promises = [];
    array.forEach((f) => promises.push(this.enqueueCallableAt(f, idx, delay)));
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
  enqueue(f, delay) {
    return (this.enqueueCallableAt(f, this.obtainIndex(), delay));
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