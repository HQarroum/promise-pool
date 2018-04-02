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
/**
 * Creating a pool of five promises using
 * the default constructor.
 */
const Pool = require('promise-pool');
const pool = new Pool(5);
```

It can also patch the existing `Promise` function for further use within the module.

```js
/**
 * Patching the `Promise` object with
 * a `Pool` object.
 */
Pool.patch(Promise);
const pool = new Promise.Pool(5);
```

> Note that the `patch` method will not modify the `Promise` object if an existing `Pool` object already exists. THe `patch` method returns a reference to the patched `Pool` object, or an undefined value if patching failed.

### Configuring the pool


