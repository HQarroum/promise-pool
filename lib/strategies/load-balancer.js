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
      this.pool.add({
        load: 0,
        idx: i,
        promise: Promise.resolve()
      });
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
      _.times(size - this.pool.array.length, (i) => {
        this.pool.add({ load: 0, idx: i + this.opts.size, promise: Promise.resolve() });
        this.emit('executor.added', { idx: i + this.opts.size });
      });
    } else if (size < this.pool.array.length) {
      for (let i = 0; this.pool.array.length > size; ++i) {
        const idx = this.pool.poll().idx;
        this.pool.trim();
        this.emit('executor.removed', { idx });
      }
    }
    this.opts.size = size;
    return (this);
  }

  /**
   * Enqueues the given callable along with its associated
   * hooks on the promise.
   * @param {*} f the function to enqueue.
   * @param {*} descriptor the descriptor associated with the promise
   * on which this method will be enqueued.
   */
  enqueueCallableOn(f, descriptor, delay) {
    let p_ = null;

    // Emits the `before.enqueue.each` event.
    this.__wrapHook(descriptor.idx, 'before.enqueue.each')(f);
    // Enqueue the `before.each` hook.
    p_ = descriptor.promise = descriptor.promise.then(
      this.__wrapHook(descriptor.idx, 'before.each')
    );
    // Enqueue the given function.
    p_= descriptor.promise = descriptor.promise.then(this.__wrapDelay(f, delay));
    // Enqueue the `after.each` hook.
    p_ = descriptor.promise = descriptor.promise.then(
      this.__wrapHook(descriptor.idx, 'after.each', this.__currentTime())
    );
    // Emits the `after.enqueue.each` event.
    this.__wrapHook(descriptor.idx, 'after.enqueue.each')(f);
    return (p_);
  }

  /**
   * Allows the execution of an array of promises
   * on the same promise executor.
   * @param {*} array an array of promises to execute.
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
   * @return a reference to the `.then()` result associated
   * with the promise which is going to execute the given
   * function.
   */
  enqueue(f, delay) {
    return (this.enqueueOnSameExecutor([f], delay));
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
}

module.exports = LoadBalancerStrategy;