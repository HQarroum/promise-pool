/**
 * Throws an exception if the given parameter is not
 * an array.
 * @param {*} array the parameter to enforce against
 * the usage of an array.
 */
const enforceArray = (array) => {
  if (!Array.isArray(array)) {
    throw new Error('Given parameter must be an array');
  }
};

/**
 * A promise pool providing sequential execution of
 * runnables spread across a promise pool.
 */
class Pool {

  /**
   * Promise pool constructor.
   * @param {*} opts options object to be used by the
   * pool to orchestrate the execution of promises.
   */
  constructor(opts) {
    this.opts = opts;
    // If `opts` is a number, use it as the size of the pool.
    if (typeof this.opts === 'number') {
      this.opts = { size: this.opts };
    }
    if (!this.opts) this.opts = {};
    this.strategyClass = typeof opts.strategy === 'function' ?
      opts.strategy : require(`./strategies/${this.opts.strategy || 'round-robin'}`);
    this.strategy = new this.strategyClass(this.opts);
  }

  /**
   * Registers a callback function to be called
   * before each execution of scheduled runnable.
   * @param {*} f a callback function to call.
   */
  beforeEach(f) {
    this.strategy.beforeEach(f);
    return (this);
  }
  
  /**
   * Registers a callback function to be called
   * after each execution of scheduled runnable.
   * @param {*} f a callback function to call.
   */
  afterEach(f) {
    this.strategy.afterEach(f);
    return (this);
  }

  /**
   * Enqueues the execution of a function by balancing it
   * throughout the promise pool.
   * @param {*} f the function to execute.
   * @return a reference to the `.then()` result associated
   * with the promise which is going to execute the given
   * function.
   */
  enqueue(f, delay) {
    return (Array.isArray(f) ? this.strategy.enqueueMany(f, delay) : this.strategy.enqueue(f, delay));
  }

  /**
   * Enqueues the execution of many functions by balancing them
   * throughout the promise pool.
   * @param {*} array an array of functions to execute.
   * @return a reference to the `.then()` result associated
   * with the promise which is going to execute the given
   * function.
   */
  enqueueMany(array, delay) {
    enforceArray(array);
    return (this.strategy.enqueueMany(array, delay));
  }

  /**
   * Allows the execution of an array of promises
   * on the same promise executor.
   * @param {*} f the function to schedule.
   */
  enqueueOnSameExecutor(array, delay) {
    enforceArray(array);
    return (this.strategy.enqueueOnSameExecutor(array, delay));
  }

  /**
   * Schedules the execution of a function by balancing it
   * throughout the promise pool.
   * @param {*} f the function to execute.
   * @return a reference to the current promise pool.
   */
  schedule(f, delay) {
    this.enqueue(f, delay);
    return (this);
  }

  /**
   * @return a promise resolved when all promises in the
   * pool have been resolved.
   */
  all() {
    return (this.strategy.all());
  }

  /**
   * Implements the `Pool` class as part of
   * the given object. This function will make sure that
   * the given `class_` does not already implement an object
   * of the same name before patching. If it does, nothing
   * happens.
   * @return a referenced to the patched promise pool if
   * the patch operation succeeded, an undefined value otherwise.
   */
  static patch(class_) {
    return (!class_.Pool ? class_.Pool = Pool : undefined);
  }
}

module.exports = Pool;