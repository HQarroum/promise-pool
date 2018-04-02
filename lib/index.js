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
   * before each scheduled runnable.
   * @param {*} f a callback function to call.
   */
  beforeEach(f) {
    this.strategy.beforeEach(f);
    return (this);
  }
  
  /**
   * Registers a callback function to be called
   * after each scheduled runnable.
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
  enqueue(f) {
    if (Array.isArray(f)) {
      return (this.strategy.enqueueMany(f));
    }
    return (this.strategy.enqueue(f));
  }

  /**
   * Enqueues the execution of many functions by balancing them
   * throughout the promise pool.
   * @param {*} array an array of functions to execute.
   * @return a reference to the `.then()` result associated
   * with the promise which is going to execute the given
   * function.
   */
  enqueueMany(array) {
    return (this.strategy.enqueueMany(array));
  }

  /**
   * Allows the execution of an array of promises
   * on the same promise executor.
   * @param {*} f the function to schedule.
   */
  enqueueOnSameExecutor(f) {
    return (this.strategy.enqueueOnSameExecutor([f]));
  }

  /**
   * Schedules the execution of a function by balancing it
   * throughout the promise pool.
   * @param {*} f the function to execute.
   * @return a reference to the current promise pool.
   */
  schedule(f) {
    if (Array.isArray(f)) {
      this.enqueueMany(f);
    } else {
      this.strategy.enqueue(f);
    }
    return (this);
  }

  /**
   * Implements the `Pool` class as part of
   * the given object.
   */
  static patch(class_) {
    class_.Pool = Pool;
  }
}
