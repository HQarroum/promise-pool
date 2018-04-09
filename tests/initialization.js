const _      = require('lodash');
const should = require('should');
const Pool   = require('../');

/**
 * @return a promise resolved if the given function throws
 * an exception, or rejected if the given function does
 * not throw an exception.
 * @param {*} f the function to call.
 * @param {*} message a message to associated with the rejected error.
 */
const catchAsPromise = (f, message) => new Promise((resolve, reject) => {
  try { f(); } catch (e) { return resolve(e); }
  reject(new Error(message));
});

/**
 * @return a promise resolved if the given function does not
 * throw an exception, or rejected if the given function does
 * throw an exception.
 * @param {*} f the function to call.
 */
const evaluateAsPromise = (f) => new Promise((resolve, reject) => {
  try { f(); } catch (e) { return reject(e); }
  resolve();
});

describe('The promise pool', function () {

  /**
   * Checking whether the `Pool` constructor only
   * accepts valid arguments.
   */
  it('should expect a number or a valid options object when instanciated', function (callback) {
    const FAILURE_MESSAGE = 'The pool should not be instanciated with invalid arguments';
    catchAsPromise(() => new Pool(), FAILURE_MESSAGE)
      .then(() => evaluateAsPromise(() => new Pool(5)))
      .then(() => evaluateAsPromise(() => new Pool({ size: 5, strategy: 'round-robin' })))
      .then(() => catchAsPromise(() => new Pool('foo')), FAILURE_MESSAGE)
      .then(() => catchAsPromise(() => new Pool({})), FAILURE_MESSAGE)
      .then(() => catchAsPromise(() => new Pool({ size: 5, strategy: 'foo' })), FAILURE_MESSAGE)
      .then(() => catchAsPromise(() => new Pool({ strategy: 'foo' })), FAILURE_MESSAGE)
      .then(() => callback())
      .catch((err) => { callback(new Error(err)); });
  });

  /**
   * Checking whether the `Pool` object can safely patch
   * the `Promise` object.
   */
  it('should be able to patch the Promise object', function () {
    should.not.exist(Promise.Pool);
    let PoolObject = Pool.patch(Promise);
    (Pool === PoolObject && Promise.Pool === Pool).should.be.true();
    (Pool.patch(Promise) === undefined).should.be.true();
    (Promise.Pool === Pool).should.be.true();
  });
});