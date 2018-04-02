/**
 * Abstract class for concrete strategy implementations
 * for the promise pool.
 */
class Strategy {

  /**
   * `Strategy` constructor.
   * @param {*} opts options associated with the
   * promise pool.
   */
  constructor(opts) {
    this.opts  = opts;
    // Verifying the given pool size value.
    if (!(opts.size > 0)) {
      throw new Error('The promise pool size must be positive');
    }
    this.hooks = {};
  }

  /**
   * Registers a callback function to be called
   * before each execution of scheduled runnable.
   * @param {*} f a callback function to call.
   */
  beforeEach(f) {
    this.hooks.beforeEach = f;
    return (this);
  }
  
  /**
   * Registers a callback function to be called
   * after each execution of scheduled runnable.
   * @param {*} f a callback function to call.
   */
  afterEach(f) {
    this.hooks.afterEach = f;
    return (this);
  }

  /**
   * A function which will call the given hook function by
   * injecting appropriate parameters and returns the result
   * of the given hook function.
   * @param {*} idx the index of the current promise.
   * @param {*} hook the name of the hook to execute.
   */
  __wrapHook(idx, hook) {
    return () => this.hooks[hook](idx, this);
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
    let p_ = null;

    if (!Array.isArray(f)) {
      throw new Error('The given parameter should be an array');
    }
    array.forEach((f) => p_ = this.enqueue(f));
    return (p_);
  }
}

module.exports = Strategy;