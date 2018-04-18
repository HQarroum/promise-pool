const Strategy = require('../strategy');
const _        = require('../common/');

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
      this.pool[i] = _.promise(i);
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
      _.times(size - this.pool.length, (i) =>
        this.pool.push(_.promise(i + this.opts.size)));
    } else if (size < this.pool.length) {
      this.index = this.__realignIndex(size);
      this.pool.splice(size, this.pool.length - size);
    }
    this.emit('pool.resized', { size: this.opts.size = size });
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
   * Allows the execution of an array of promises
   * on the same promise executor.
   * @param {*} array an array of promises to execute.
   * @param {*} delay the delay in milliseconds to apply before
   * calling each function in the given `array`.
   */
  enqueueOnSameExecutor(array, delay) {
    const descriptor = this.pool[this.obtainIndex()];
    const promises   = [];

    array.forEach((f) => promises.push(
      this.__enqueue(f, descriptor, delay))
    );
    return (Promise.all(promises));
  }

  /**
   * Schedules the execution of a function by balancing it
   * throughout the promise pool.
   * @param {*} f the function to execute.
   * @param {*} delay the delay in milliseconds to apply before
   * calling the given function.
   * @return a reference to the `.then()` result associated
   * with the promise which is going to execute the given
   * function.
   */
  enqueue(f, delay) {
    return (this.__enqueue(f, this.pool[this.obtainIndex()], delay));
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
    return Promise.all(this.pool.map((e) => e.promise)).then(() => {
      this.removeListener('after.each', callback);
      return (
        Promise.resolve(results
          .sort((a, b) => a.insertedAt - b.insertedAt)
          .map((entry) => entry.result))
      );
    });
  }

  /**
   * @return an array of the internal promise pool.
   * @private this API is subject to change.
   */
  promises() {
    return (this.pool);
  }
}

module.exports = RoundRobinStrategy;