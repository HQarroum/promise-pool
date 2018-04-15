# pool-monitoring
> An example featuring a live chart of the promise pool execution state.

[![asciicast](https://asciinema.org/a/YrNLcfAkFueFr0TLqhGXHgAFJ.png)](https://asciinema.org/a/YrNLcfAkFueFr0TLqhGXHgAFJ)

## Install

Go to the `examples/pool-monitoring` directory in your terminal, and install the command-line dependencies as follow.

```bash
npm install
```

## Description

This example features a command-line tool allowing you to control the execution of promises within a pool instance. This command-line tool will schedule a given number of promises on the pool over a random period of time (the number of promises spread across the executors will increase), and will await for the scheduled promises to complete (the number of promises spread across the executors will gradually decrease).

### Options

 - `-p`, `--pool-size` - The size of the pool to enforce on the pool instance
 - `-s`, `--strategy` - The strategy to use on the pool (`random`, `round-robin`, `load-balancer`)
 - `-n`, `--number` - The number of promises to schedule on the pool
 
## Example

```bash
# Schedules `700` promises on a `random` strategy pool of `20 executors.
node index.js -n 700 -s random -p 20
```
