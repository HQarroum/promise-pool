<h1 align="center">
	<br>
	<br>
	<br>
	<br>
	<br>
	<img width="1200" src="https://github.com/HQarroum/promise-pool/raw/master/assets/logo.png" alt="logo">
	<br>
	<br>
	<br>
	<br>
	<br>
</h1>

> A Promise pool implementation supporting sequential execution of promises across a pool.

[![Build Status](https://travis-ci.org/HQarroum/promise-pool.svg?branch=master)](https://travis-ci.org/HQarroum/promise-pool) [![Code Climate](https://codeclimate.com/repos/55e34093e30ba072de0013d2/badges/acc2df5cc7f78c301ad9/gpa.svg)](https://codeclimate.com/repos/55e34093e30ba072de0013d2/feed)

## Table of contents

- [Installation](#installation)
- [Description](#description)
- [Usage](#usage)
- [Examples](#examples)
- [See also](#see-also)

## Installation

**Using NPM**

```bash
npm install --save promise-pool
```

## Description

This module provides a [promise](https://scotch.io/tutorials/javascript-promises-for-dummies) pool implementation which allows developers to sequentially execute multiple functions returning a promise, across a promise pool of dynamic size.

Use-cases associated with this module can be multiple and range from operations such as rate limiting (e.g when it is necessary to throttle the amount of concurrent requests issued against a given service), to basic sequential promise execution, segmentation of execution of promises, etc.

## Usage

To include the `promise-pool` module into your application, you must first include it as follow.

```js
const Pool = require('promise-pool');
```

### Instantiating the pool

The promise pool can be instanciated using the constructor function returned by `require`.

```js
const pool = new Pool(5);
```

### Introducing strategies

In order to allow users of this library to choose how to balance the execution of promises within the pool, the [strategy pattern](https://en.wikipedia.org/wiki/Strategy_pattern) has been used to inject external behaviors at runtime. There are 3 built-in strategies already implemented, but you can also provide your own implementation in the context of advanced use-cases.

#### Round-robin strategy

This is the default strategy which is loaded by the pool when no strategies have been specified. Its behavior is simple, promises will be sequentially inserted in the pool starting from the first promise in the pool to the latest, while looping to the first one once every promises have been used.

Note that while the insertion is sequential, the execution of the promises may not be sequential as this depends on the type of process your promises are executing.

If you'd like to explicitely specify the `round-robin` strategy, you can do so by passing an option object to the `Pool` constructor:

```js
const pool = new Pool({
  size: 5,
  strategy: 'round-robin'
});
```

#### Random strategy

The `random` strategy will insert new scheduled promises at a random index in the pool. The distribution of executed promises within the pool mainly depends on the quality of the randomness seed associated with `Math.random()`.

```js
const pool = new Pool({
  size: 5,
  strategy: 'random'
});
```

#### Load balancer strategy

The `load-balancer` strategy actually computes the amount of load for each promises in the pool by keeping a count of the queued promises on each promise of the pool. This comes in handy when your promises are executing operations in a non-deterministic time (e.g network requests) to optimize the execution of a maximum amount of promises in the smallest possible amount of time.

```js
const pool = new Pool({
  size: 5,
  strategy: 'load-balancer'
});
```

#### Custom strategies

It is possible to provide a custom implementation of a promise scheduler into the pool constructor by passing it the instance of your scheduler.

```js
const opts = { size: 5 };
opts.strategy = new CustomStrategy(opts);
const pool = new Pool(opts);
```

> See [Implementing a custom strategy](#implementing-custom-strategies) for more details on how to implement a custom strategy compatible with the promise pool.

### Scheduling promises

The core of this module is of course to allow scheduling of promises within the pool. To do so, different methods exists that provides different interfaces associated with different use-cases. The next sections will expose minimal working code for each example. For the sake of simplicity, the boilerplate code will be omitted, in order to get the full examples, have a look at the [examples](https://github.com/HQarroum/promise-pool/edit/master/examples) directory.

#### The `.schedule()` API

This API makes it possible to execute functions returning promise objects using a fluent interface, and in a fire-and-forget manner. Use this API if you'd like to handle the result of the execution of a promise yourself.

```js
// Spreads 100 promise executions across the pool.
for (let i = 0; i < 100; ++i) {
  pool.schedule(promise(i));
}
```

#### The `.enqueue()` API

This API works like `.schedule()` in that it will enqueue a promise execution in the available pool of promises, but unlike `.schedule()` it will return a promise which is resolved (or rejected) once the initial promise has been executed.

```js
// Sequentially enqueuing promises using standard `.then()`.
pool.enqueue(promise(1)).then(() => pool.enqueue(promise(2))).then(console.log);
```

#### The `.enqueueMany()` API

This API works like `.enqueue()` but will allow you to provide an array of functions at once, while being able to catch th results yield by each of them.

```js
// Enqueuing multiple promises and gathering their results using standard `.then()`.
// The following statement will output : [1, 2, 3]
pool.enqueueMany([ promise(1), promise(2), promise(3) ]).then(console.log);
```

> Note that passing an array of function to `.enqueue` has the same effect than calling `.enqueueMany`.

#### The `.enqueueOnSameExecutor()` API

Sometimes, it is useful to enqueue an array of promises on the same executor, such that it is guaranteed that these promises will be executed sequentially (e.g you would like to run in parallel a sequence of promises which, individually, will each run sequentially within the sequence). To do so, you can use the `.enqueueOnSameExecutor()` API as follow.

```js
// Sequentially enqueuing promises using standard `.then()`.
Promise.all([
  pool.enqueueOnSameExecutor([ promise(1), promise(2), promise(3) ]),
  pool.enqueueOnSameExecutor([ promise(4), promise(5), promise(6) ])
]).then(console.log);
```

#### The `.all()` API

Once you have scheduled a set of promise executions, you may want to wait for the completion of all the promises scheduled in the pool. To do so, you can use the `.all` API which has the same semantics as `Promise.all`.

```js
for (let i = 0; i < 100; ++i) {
  pool.schedule(promise(i));
}

// Waiting for all scheduled promises to be executed,
// and prints the result to the standard output.
pool.all().then(console.log);
```

Note that the `.all` method will by default forward to the end callback an array of results yield by all the promises in execution at the time `.all` has been called, in the same order as they were enqueued in the pool.

### Delaying promise executions

While scheduling or enqueuing promises, it is possible to delay their execution in time. To do so, you can provide a delay in milliseconds as a second argument of `.schedule`, `.enqueue`, `.enqueueMany` and `enqueueOnSameExecutor` to specify how much time should last before executing the given promise.

Note that this delay will **not** specify the amount of time *between each promise execution* since all promises do not execute sequentially, but rather the delay before executing them. For instance, in a pool of 5 executors and given 5 promises scheduled with a delay of 1 second, the 5 promises will all be executed in parallel after a period of 1 second since they are all going to be executed in parallel.

```js
for (let i = 0; i < 5; ++i) {
  pool.schedule(promise(i), 1000);
}
// Resolves after 1 second.
pool.all().then(console.log);
```

If you'd like to enforce a delay between each promise execution, you need to enqueue them sequentially with `enqueueOnSameExecutor`, such as in the below example.

```js
// Will resolve after 3 seconds (1 second for each promise execution).
pool.enqueueOnSameExecutor([ promise(1), promise(2), promise(3) ], 1000).then(console.log);
```

### Lifecycle events

The promise pool implements the ability for user of the pool to register to two lifecycle events using two interfaces :

  - `.beforeEach` allows to register callback functions called before the execution of each scheduled promises.
  - `.afterEach` allows to register callback functions called after the execution of each scheduled promises.

```js
// Subscribing to lifecycle events on the pool.
pool.beforeEach((idx) => {
  console.log(`[+] Before execution of promise ${idx}`);
}).afterEach((idx) => {
  console.log(`[+] After execution of promise ${idx}`);
});
```

### Patching the `Promise` object

For commodity, it is possible to patch the existing `Promise` function with the `Pool` object for further use within your application.

```js
// Patch the global `Promise` object.
Pool.patch();
const pool = new Promise.Pool(5);
```

> Note that the `patch` method will not modify the `Promise` object if an existing `Pool` object already exists. THe `patch` method returns a reference to the patched `Pool` object, or an undefined value if the patching operation failed.

