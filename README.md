<h1 align="center">
	<br>
	<br>
	<br>
	<br>
	<br>
	<img width="1200" src="https://github.com/HQarroum/promise-pool/raw/master/assets/logo.png" alt="styleshift">
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

This module implements a promise pool implementation which allows developers to execute sequentially multiple functions returning a promise, across a promise pool of dynamic size.

Use-cases associated with this module can be multiple and can range from operations such as rate limiting (e.g when it is necessary to throttle the amount of concurrent requests issued against a given service), sequential promise execution enforcement, segmentation of execution of promises, etc.

## Usage

To include the `promise-pool` module into your application, you must first include it as follow.

```js
const Pool = require('promise-pool');
```

### Instantiating the pool

The promise pool can be instanciated using the constructor function returned by `require`.

```js
const Pool = require('promise-pool');
const pool = new Pool(5);
```

It can also patch the existing `Promise` function for further use within the module.

```js
const Pool = require('promise-pool');

// Patch the global `Promise` object.
if (Pool.patch()) {
  const pool = new Promise.Pool(5);
}
```

> Note that the `patch` method will not modify the `Promise` object if an existing `Pool` object already exists. THe `patch` method returns a reference to the patched `Pool` object, or an undefined value if patching failed.

### Introducing strategies

In order to allow users of this library to choose how to balance the execution of promises within the pool, the [strategy pattern](https://en.wikipedia.org/wiki/Strategy_pattern) has been used to inject external behaviors at runtime. There are 3 built-in strategies already implemented, but you can also provide your own implementation in the context of advanced use-cases.

#### Round-robin strategy

This is the default strategy which is loaded by the pool when no particular strategies have been specified. Its behavior is simple, promises will be sequentially inserted in the pool starting from the first promise in the pool to the latest, while looping to the first one when every promises have been used.

Note that while the insertion is sequential, the execution of the promises may not be linearly sequential as this depends on the type of process the promise function are executing.

If you'd like to explicitely specify the `round-robin` strategy, you can pass an option object to the `Pool` constructor:

```js
const pool = new Pool({
  size: 5,
  strategy: 'round-robin'
});
```

#### Random strategy

The `random` strategy will randomly insert new scheduled promises at a random index in the pool. The distribution of executed promises within the pool mainly depend on the quality of the randomness seed.

```js
const pool = new Pool({
  size: 5,
  strategy: 'random'
});
```

#### Load balancer strategy

The `load-balancer` strategy actually computes the amount of load for each promises in the pool by keeping a count of the queued promises on each promise of the pool. This comes in handy when your promises are executing operations in a non-deterministic time (e.g network requests) to optimize the execution of a maximum amount of promises in the smallest possible time.

```js
const pool = new Pool({
  size: 5,
  strategy: 'load-balancer'
});
```

