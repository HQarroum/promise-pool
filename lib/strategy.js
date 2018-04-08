/**
 * The number of nanoseconds per second.
 */
const NS_PER_SEC = 1e9;

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
    if (!Promise) {
      throw new Error('There is no `Promise` support for your environment');
    }
    this.opts = opts;
    // Verifying the given pool size value.
    if (!(opts.size > 0)) {
      throw new Error('The promise pool size must be positive');
    }
    // Lifecycle hooks.
    this.hooks = { beforeEach: [], afterEach: [] };
  }

  /**
   * Registers a callback function to be called
   * before each execution of scheduled runnable.
   * @param {*} f a callback function to call.
   */
  beforeEach(f) {
    this.hooks.beforeEach.push(f);
    return (this);
  }

  /**
   * Unregisters the given callback function
   * from the `beforeEach` hooks.
   * @param {*} f the function to unregister.
   */
  removeBeforeEach(f) {
    for (let i = 0; i < this.hooks.beforeEach.length; ++i) {
      if (this.hooks.beforeEach[i] === f) {
        this.hooks.beforeEach.splice(i, 1);
      }
    }
  }
  
  /**
   * Registers a callback function to be called
   * after each execution of scheduled runnable.
   * @param {*} f a callback function to call.
   */
  afterEach(f) {
    this.hooks.afterEach.push(f);
    return (this);
  }

  /**
   * Unregisters the given callback function
   * from the `afterEach` hooks.
   * @param {*} f the function to unregister.
   */
  removeAfterEach(f) {
    for (let i = 0; i < this.hooks.afterEach.length; ++i) {
      if (this.hooks.afterEach[i] === f) {
        this.hooks.afterEach.splice(i, 1);
      }
    }
  }

  /**
   * @return the current time in nanoseconds.
   */
  __currentTime() {
    const time = process.hrtime();
    return (time[0] * NS_PER_SEC + time[1]);
  }

  /**
   * A function which will call the given hook function by
   * injecting appropriate parameters and returns the result
   * of the given hook function.
   * @param {*} idx the index of the current promise.
   * @param {*} hook the name of the hook to execute.
   */
  __wrapHook(idx, hook, insertedAt) {
    return function (arg) {
      this.hooks[hook].forEach((h) => h(idx, this, arg, insertedAt));
      return (Promise.resolve(arg));
    }.bind(this);
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