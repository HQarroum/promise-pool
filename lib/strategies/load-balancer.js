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
  enqueueCallableOn(f, descriptor, delay) {
    let p_ = null;

    // Calling the `beforeEnqueueEach` hooks.
    this.__wrapHook(descriptor.idx, 'beforeEnqueueEach')(f);
    // Enqueue the `beforeEach` hook.
    if (this.hooks.beforeEach.length > 0) {
      p_ = descriptor.promise = descriptor.promise.then(
        this.__wrapHook(descriptor.idx, 'beforeEach')
      );
    }
    // Enqueue the given function.
    p_= descriptor.promise = descriptor.promise.then(this.__wrapDelay(f, delay));
    // Enqueue the `afterEach` hook.
    if (this.hooks.afterEach.length > 0) {
      p_ = descriptor.promise = descriptor.promise.then(
        this.__wrapHook(descriptor.idx, 'afterEach', this.__currentTime())
      );
    }
    // Calling the `afterEnqueueEach` hooks.
    this.__wrapHook(descriptor.idx, 'afterEnqueueEach')(f);
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
    const callback = (_1, _2, result, insertedAt) => results.push({ result, insertedAt });

    // Intercepting promise results until all promises
    // have been resolved.
    this.afterEach(callback);
    // Sorting the result array by inserted time.
    return Promise.all(this.pool.array.map((e) => e.promise)).then(() => {
      this.removeAfterEach(callback);
      return (
        Promise.resolve(results
          .sort((a, b) => a.insertedAt - b.insertedAt)
          .map((entry) => entry.result))
      );
    });
  }
}

module.exports = LoadBalancerStrategy;