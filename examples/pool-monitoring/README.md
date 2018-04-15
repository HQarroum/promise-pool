# pool-monitoring
> An example featuring a live chart of the promise pool execution state.

[![asciicast](https://asciinema.org/a/YrNLcfAkFueFr0TLqhGXHgAFJ.png)](https://asciinema.org/a/YrNLcfAkFueFr0TLqhGXHgAFJ)

## Install

```bash
npm install
```

## Description

This example features a command-line tool allowing you to control the execution of promises within a pool instance.

### Options

 - `-p`, `--pool-size` - The size of the pool to enforce on the pool instance
 - `-s`, `--strategy` - The strategy to use on the pool (`random`, `round-robin`, `load-balancer`)
 - `-n`, `--number` - The number of promises to schedule on the pool
 
## Example

```bash
# Schedules `700` promises on a `random` strategy pool of `20 executors.
node index.js -n 700 -s random -p 20
```
