const program  = require('commander');
const watch    = require('pool-watch');
const Pool     = require('../../index');

program
  .version('1.0.0')
  .option('-n, --number [number]', 'The number of promises to schedule')
  .option('-p, --pool-size [size]', 'The size of the pool')
  .option('-s, --strategy [strategy]', 'The name of the pool strategy to use')
  .option('-v, --variation <variation>', 'The variation to apply to the pool size after a random delay')
  .parse(process.argv);

/**
 * Generates a random value between `min` and `max`.
 * @return a number between `min` and `max`.
 * @param min the lower number value to generate.
 * @param min the higher number value to generate.
 */
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * @return a promise resolved when the given `timeout`
 * has been reached.
 * @param {*} timeout the timeout to wait.
 */
const awaitAsync = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

/**
 * Process execution of a promise.
 */
const promise = () => () => awaitAsync(random(200, 500));

// Enforcing command-line parameters validity.
['number', 'poolSize', 'strategy', 'variation'].forEach((key) => {
  if (!program[key]) {
    program.outputHelp();
    process.exit(1);
  }
});
program.poolSize = new Number(program.poolSize);
program.variation = new Number(parseInt(program.variation));

// Creating the promise pool instance.
const pool = new Pool({
  size: program.poolSize,
  strategy: program.strategy
});

/**
 * Schedules the execution of `program.number` promises
 * in the pool.
 */
const execute = () => {
  const p_ = [];

  for (let i = 0; i < program.number; ++i) {
    p_.push(awaitAsync(random(5000, 1000)).then(() => pool.schedule(promise())));
    // Randomly resizing the pool.
    setTimeout(() => pool.resize(program.poolSize + program.variation), random(2000, 2500));
  }
  return (Promise.all(p_));
};

// Configuring `watch` to display the live chart on `stdout`.
watch(pool, { total: program.number }).pipe(process.stdout);

// Waiting for the execution of all promises in the pool.
execute().then(() => pool.all()).then(() => console.log('[+] All promises have been executed !'));