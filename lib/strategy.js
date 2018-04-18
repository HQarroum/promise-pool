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
   * @return a function which will track the load of a promise
   * during its execution.
   * @param {*} f the function to enqueue.
   * @param {*} descriptor the descriptor associated with the promise
   * on which this method will be enqueued.
   * @param {*} delay the delay in milliseconds to apply before
   * calling the given function.
   */
  __enqueue(f, descriptor, delay) {
    const f_ = () => f().then(function (arg) {
      descriptor.load--;
      return (arg);
    }.bind(this));
    descriptor.load++;
    return (this.enqueueCallableOn(f_, descriptor, delay));
  }

  /**
   * Enqueues the given callable along with its associated
   * hooks on the promise.
   * @param {*} f the function to enqueue.
   * @param {*} descriptor the descriptor associated with the promise
   * on which this method will be enqueued.
   * @param {*} delay the delay in milliseconds to apply before
   * calling the given function.
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