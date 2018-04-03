const Strategy      = require('../strategy');
const PriorityQueue = require('fastpriorityqueue');

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
   * Enqueues the given callable along with its associated
   * hooks on the promise.
   * @param {*} f the function to enqueue.
   * @param {*} descriptor the descriptor associated with the promise
   * on which this method will be enqueued.
   */
  enqueueCallableOn(f, descriptor) {
    let p_ = null;

    // Enqueue the `beforeEach` hook.
    if (this.hooks.beforeEach) {
      p_ = descriptor.promise = descriptor.promise.then(
        this.__wrapHook(descriptor.idx, 'beforeEach')
      );
    }
    // Enqueue the given function.
    p_= descriptor.promise = descriptor.promise.then(f);
    // Enqueue the `afterEach` hook.
    if (this.hooks.afterEach) {
      p_ = descriptor.promise = descriptor.promise.then(
        this.__wrapHook(descriptor.idx, 'afterEach')
      );
    }
    return (p_);
  }

  /**
   * Allows the execution of an array of promises
   * on the same promise executor.
   * @param {*} array an array of promises to execute.
   */
  enqueueOnSameExecutor(array) {
    const descriptor = this.pool.poll();
    let p_           = null;

    array.forEach((f) => {
      const f_ = () => f().then(function (arg) {
        descriptor.load--;
        this.pool._percolateDown(0 | 0);
        return (arg);
      }.bind(this));
      p_ = this.enqueueCallableOn(f_, descriptor);
      descriptor.load++;
      this.pool.add(descriptor);
    });
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
    return (this.enqueueOnSameExecutor([f]));
  }

  /**
   * @return a promise resolved when all promises in the
   * pool have been resolved.
   */
  all() {
    return (Promise.all(this.pool.array.map((e) => e.promise)));
  }

  /**
   * @return a promise having the lowest load from the internal
   * promise pool.
   */
  promise() {
    return (this.pool.poll().promise);
  }
}

module.exports = LoadBalancerStrategy;