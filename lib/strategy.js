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
  }

  /**
   * @return the current time in nanoseconds.
   */
  __currentTime() {
    const time = process.hrtime();
    return (time[0] * NS_PER_SEC + time[1]);
  }

  /**
   * @return a function which will emit the given `event` by
   * associating it with the appropriate parameters and returns the result
   * of the given hook function.
   * @param {*} idx the index of the current promise.
   * @param {*} event the name of the event to emit.
   */
  __wrapHook(idx, event, insertedAt) {
    return function (result) {
      this.emit(event, { idx, strategy: this, result, insertedAt });
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