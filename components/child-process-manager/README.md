[![Build status](https://github.com/Telefonica/confluence-tools/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/Telefonica/confluence-tools/actions?query=workflow%3Abuild+branch%3Amain) [![Last commit](https://img.shields.io/github/last-commit/Telefonica/confluence-tools.svg)](https://github.com/Telefonica/confluence-tools/commits) [![Last release](https://img.shields.io/github/release-date/Telefonica/confluence-tools.svg)](https://github.com/Telefonica/confluence-tools/releases)

[![NPM downloads](https://img.shields.io/npm/@telefonica/child-process-manager.svg)](https://www.npmjs.com/package/@telefonica/child-process-manager) [![License](https://img.shields.io/npm/l/@telefonica/child-process-manager.svg)](https://github.com/Telefonica/confluence-tools/blob/main/components/child-process-manager/LICENSE)

# child-process-manager

Async child process manager providing access to exit code and stdout/stderr logs.

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Example](#example)
- [API](./API.md)
- [Contributing](#contributing)
- [License](#license)

## Description

This library enables to create a child process using [`cross-spawn`](https://github.com/moxystudio/node-cross-spawn), which provides compatibility across different operating systems, and manage it asynchronously. It mainly provides:

* Enables to manage child processes as promises. The promise is resolved with the exit code and logs when the process finishes.
* Method to kill the child process at any time. It returns a promise that is resolved when the process is killed.
* Method to get the logs of the child process at any moment. It returns an array with the stdout/stderr of the process until that moment.

It is useful to execute shell commands from tests and check their output, for example.

## Installation

Install the package using npm:

```bash
npm install @telefonica/child-process-manager
```

## Example

Import the library, create a child process and wait for it to finish. It will return the exit code and the array of logs in the resolved object.

```js title="Example"
import { ChildProcessManager } from '@telefonica/child-process-manager';

const childProcess = new ChildProcessManager(["echo", 'Hello world!']);

const { logs, exitCode } = await childProcess.run();

console.log(logs); // ["Hello world!"]
console.log(exitCode); // 0
```

## API

### Constructor

* __`ChildProcessManager(command, options?, spawnOptions?): ChildProcessManager`__: Creates a new child process manager with the given command and options.
  * `command` - `string[]`: Command to be executed, and its arguments.
  * `options` - `object` : Object containing next properties:
      * `env` - `object`: Environment key-value pairs to be added to the child process.
      * `silent` - `boolean`: If true, the child process will not output anything to the console (but it will still be stored in the logs). Default is `false`.
      * `cwd` - `string`: Current working directory of the child process. Default is `process.cwd()`.
  * `spawnOptions` - `object`: Options to be passed directly to the [`cross-spawn` library](https://github.com/moxystudio/node-cross-spawn) when creating the child process.
      
### Methods

* __`run(): Promise<{ logs: string[], exitCode: number }> `__: Runs the child process and returns a promise that resolves with the logs and exit code when the process finishes.
* __`kill(): Promise<{ logs: string[], exitCode: number | null }>`__: Kills the child process and returns a promise that resolves when the process is killed. In case the process did not start yet, it will return `null` as the exit code.

### Properties

* __`logs: string[]`__: Array containing the logs of the child process. It is updated in real-time as the process outputs data.
* __`exitCode: number | null`__: Exit code of the child process. It is `null` if the process did not finish yet.
* __`exitPromise`__: Promise that resolves when the child process finishes. It is resolved with the logs and exit code. It will be `undefined` if the process did not start yet.

## Contributing

Please read our [Contributing Guidelines](./CONTRIBUTING.md) for details on how to contribute to this project before submitting a pull request.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](./LICENSE) file for details.
