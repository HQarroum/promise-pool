const Strategy = require('../strategy');
const _        = require('..//common/');

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
   * Resizes the internal promise pool with the given `size`.
   * @param {*} size the new size of the promise pool.
   * @return a reference to the current strategy.
   */
  resize(size) {
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error('Size should be a positive integer');
    }
    if (size > this.pool.length) {
      _.times(size - this.pool.length, (i) => {
        this.pool.push(Promise.resolve());
        this.emit('executor.added', { idx: i + this.opts.size });
      });
    } else if (size < this.pool.length) {
      const removed = this.pool.length - size;
      this.pool.splice(size, this.pool.length - size);
      _.times(removed, (i) => this.emit('executor.removed', { idx: i + size }));
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
    return (_.random(0, this.pool.length - 1));
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
    // Emits the `before.enqueue.each` event.
    this.__wrapHook(idx, 'before.enqueue.each')(f);
    // Enqueue the `before.each` hook.
    p_ = this.__enqueue(this.__wrapHook(idx, 'before.each'), idx);
    // Enqueue the given function.
    p_ = this.__enqueue(this.__wrapDelay(f, delay), idx);
    // Enqueue the `after.each` hook.
    p_ = this.__enqueue(this.__wrapHook(idx, 'after.each', this.__currentTime()), idx);
    // Emits the `after.enqueue.each` event.
    this.__wrapHook(idx, 'after.enqueue.each')(f);
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
    const callback = (event) => results.push(event);

    // Intercepting promise results until all promises
    // have been resolved.
    this.on('after.each', callback);
    // Sorting the result array by inserted time.
    return Promise.all(this.pool).then(() => {
      this.removeListener('after.each', callback);
      return (
        Promise.resolve(results
          .sort((a, b) => a.insertedAt - b.insertedAt)
          .map((entry) => entry.result))
      );
    });
  }
}

module.exports = RandomStrategy;