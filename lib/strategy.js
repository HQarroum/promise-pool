const EventEmitter = require('events').EventEmitter;

/**
 * The number of nanoseconds per second.
 */
const NS_PER_SEC = 1e9;

/**
 * Abstract class for concrete strategy implementations
 * for the promise pool.
 */
class Strategy extends EventEmitter {

  /**
   * `Strategy` constructor.
   * @param {*} opts options associated with the
   * promise pool.
   */
  constructor(opts) {
    super();
    if (!Promise) {
      throw new Error('There is no `Promise` support for your environment');
    }
    this.opts = opts;
    // Verifying the given pool size value.
    if (!(opts.size > 0)) {
      throw new Error('The promise pool size must be a positive integer');
    }
    // Lifecycle hooks.
    this.hooks = { beforeEach: [], afterEach: [], beforeEnqueueEach: [], afterEnqueueEach: [] };
  }

  /**
   * Internal helper to register hook functions.
   * @param {*} scope the scope on which `f` should be registered.
   * @param {*} f a callback function to register.
   */
  __registerHook(scope, f) {
    this.hooks[scope].push(f);
    return (this);
  }

  /**
   * Internal helper to unregister hook functions.
   * @param {*} scope the scope from which `f` should be unregistered.
   * @param {*} f a callback function to unregister.
   */
  __unregisterHook(scope, f) {
    for (let i = 0; i < this.hooks[scope].length; ++i) {
      if (this.hooks[scope][i] === f) {
        this.hooks[scope].splice(i, 1);
      }
    }
    return (this);
  }

  /**
   * Registers a callback function to be called
   * before each execution of scheduled runnable.
   * @param {*} f a callback function to register.
   */
  beforeEach(f) {
    return (this.__registerHook('beforeEach', f));
  }

  /**
   * Registers a callback function to be called
   * before each enqueuing of a runnable in the pool.
   * @param {*} f a callback function to register.
   */
  beforeEnqueueEach(f) {
    return (this.__registerHook('beforeEnqueueEach', f));
  }

  /**
   * Unregisters the given callback function
   * from the `beforeEach` hooks.
   * @param {*} f the function to unregister.
   */
  removeBeforeEach(f) {
    return (this.__unregisterHook('beforeEach', f));
  }
  
  /**
   * Unregisters the given callback function
   * from the `beforeEnqueueEach` hooks.
   * @param {*} f the function to unregister.
   */
  removeBeforeEnqueueEach(f) {
    return (this.__unregisterHook('beforeEnqueueEach', f));
  }

  /**
   * Registers a callback function to be called
   * after each execution of scheduled runnable.
   * @param {*} f a callback function to register.
   */
  afterEach(f) {
    return (this.__registerHook('afterEach', f));
  }

  /**
   * Registers a callback function to be called
   * after each enqueueing of a runnable in the pool.
   * @param {*} f a callback function to register.
   */
  afterEnqueueEach(f) {
    return (this.__registerHook('afterEnqueueEach', f));
  }

  /**
   * Unregisters the given callback function
   * from the `afterEach` hooks.
   * @param {*} f the function to unregister.
   */
  removeAfterEach(f) {
    return (this.__unregisterHook('afterEach', f));
  }

  /**
   * Unregisters the given callback function
   * from the `afterEnqueueEach` hooks.
   * @param {*} f the function to unregister.
   */
  removeAfterEnqueueEach(f) {
    return (this.__unregisterHook('afterEnqueueEach', f));
  }

  /**
   * @return the current time in nanoseconds.
   */
  __currentTime() {
    const time = process.hrtime();
    return (time[0] * NS_PER_SEC + time[1]);
  }

  /**
   * @return a function which will call the given hook function by
   * injecting appropriate parameters and returns the result
   * of the given hook function.
   * @param {*} idx the index of the current promise.
   * @param {*} hook the name of the hook to execute.
   */
  __wrapHook(idx, hook, insertedAt) {
    return function (arg) {
      this.emit(hook, { idx, strategy: this, result, insertedAt });
      this.hooks[hook].forEach((h) => h(idx, this, result, insertedAt));
      return (Promise.resolve(result));
    }.bind(this);
  }

  /**
   * @return a function which will delay the call to the given
   * function according to the `delay` parameter.
   * @param {*} f the function to execute.
   * @param {*} delay the delay in milliseconds to apply before
   * calleding the given function.
   */
  __wrapDelay(f, delay) {
    return (!delay ? f : function () {
      return new Promise((resolve) => {
        setTimeout(() => resolve(f()), delay);
      });
    });
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
    let promises = [];

    if (!Array.isArray(array)) {
      throw new Error('The given parameter should be an array');
    }
    array.forEach((f) => promises.push(this.enqueue(f, delay)));
    return (Promise.all(promises));
  }
}

module.exports = Strategy;