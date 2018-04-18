const Strategy      = require('../strategy');
const PriorityQueue = require('fastpriorityqueue');
const _             = require('../common/');

/**
 * Default comparator for the `LoadBalancerStrategy`.
 * Makes the promise with the least amount of load the
 * highest priority promise.
 * @param {*} a first promise descriptor to compare.
 * @param {*} b second promise descriptor to compare.
 */
const defaultComparator = (a, b) => a.load < b.load;

/**
 * The `LoadBalancerStrategy` balances the
 * execution of promises within the promise pool
 * in a load balanced manner.
 */
class LoadBalancerStrategy extends Strategy {

  /**
   * `LoadBalancerStrategy` constructor.
   * @param {*} opts options associated with the
   * promise pool
   */
  constructor(opts) {
    super(opts);
    this.pool = new PriorityQueue(opts.comparator || defaultComparator);
    // Creating `opts.size` resolved promises.
    for (let i = 0; i < opts.size; ++i) {
      this.pool.add(_.promise(i));
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
    if (size > this.pool.array.length) {
      _.times(size - this.pool.array.length, (i) =>
        this.pool.add(_.promise(i + this.opts.size)));
    } else if (size < this.pool.array.length) {
      for (let i = 0; this.pool.array.length > size; ++i) {
        this.pool.poll();
        this.pool.trim();
      }
    }
    this.emit('pool.resized', { size: this.opts.size = size });
    return (this);
  }

  /**
   * Allows the execution of an array of promises
   * on the same promise executor.
   * @param {*} array an array of promises to execute.
   * @param {*} delay the delay in milliseconds to apply before
   * calling each function in the given `array`.
   */
  enqueueOnSameExecutor(array, delay) {
    const descriptor = this.pool.poll();
    const promises   = [];

    array.forEach((f) => {
      const f_ = () => f().then(function (arg) {
        descriptor.load--;
        this.pool._percolateDown(0 | 0);
        return (arg);
      }.bind(this));
      promises.push(this.enqueueCallableOn(f_, descriptor, delay));
      descriptor.load++;
      this.pool.add(descriptor);
    });
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
    return (this.enqueueOnSameExecutor([f], delay).then((r) => Promise.resolve(r[0])));
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
    return Promise.all(this.pool.array.map((e) => e.promise)).then(() => {
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
    return (this.pool.array);
  }
}

module.exports = LoadBalancerStrategy;