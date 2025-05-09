# How to contribute

First of all, thank you for considering contributing to the this project! 🎉

# Table of contents

- [Development](#development)
  - [Common guidelines](#common-guidelines)
  - [Installation](#installation)
  - [Monorepo tool](#monorepo-tool)
  - [Unit tests](#unit-tests)
  - [Build](#build)
  - [NPM scripts reference](#npm-scripts-reference)
- [License, Code of Conduct, and Contribution License Agreement](#license-code-of-conduct-and-contribution-license-agreement)
- [Pull requests](#pull-requests)

## Development

### Common guidelines

Please refer to the main [CONTRIBUTING.md](../../.github/CONTRIBUTING.md) file in this repository for general guidelines about contributing to this project. Once you have read and understood them, you can follow the specific guidelines for this component.

### Installation

This repository use Pnpm as dependencies manager. So, to start working on them, you have to install the dependencies by running `pnpm install` in the root folder of the repository.

Please refer to the monorepo README file for further information about [common requirements](../../README.md#requirements) and [installation process](../../README.md#installation).

### Monorepo tool

The repository uses [Nx](https://nx.dev/) as monorepo tool for managing dependencies between component tasks, so, you should run any command for this component from the repository root folder, and Nx will take care of executing the dependent commands in the right order.

For example, a command that could be executed like this in this folder:

```sh title="Execute unit tests of the component inside its folder"
pnpm run test:unit
```

> ![WARNING] No management of task dependencies
> The previous command will only execute the unit tests of the component, which may fail if the component has dependencies that are not built yet, for example.

Should be executed like this in any folder of the repository:

```sh title="Execute unit tests of the component, and all needed dependencies, from any folder"
pnpm nx test:unit child-process-manager
```

> ![TIP] Management of task dependencies
> The previous command will execute the unit tests of the component and all the dependencies needed to run them, and will take advantage of the cache to avoid unnecessary executions.

### Unit tests

Unit tests are executed using [Jest](https://jestjs.io/). To run them, execute the following command:

```sh
pnpm nx test:unit child-process-manager
```

### Build

This command generates the library into the `dist` directory. __Note that other components in the repository won't be able to use the library until this command is executed.__

```sh
pnpm nx build child-process-manager
```

### NPM scripts reference

- `build` - Build the library.
- `check:all` - Run all checks, tests, and build.
- `test:unit` - Run unit tests.
- `check:spell` - Checks spelling.
- `check:types` - Checks the TypeScript types.
- `lint` - Lint the code.

## License, Code of Conduct, and Contribution License Agreement

By contributing to this project, you agree that your contributions will be licensed under the [LICENSE](./LICENSE) file in this folder, and that you agree to the terms described in the [CONTRIBUTING.md](../../.github/CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](../../.github/CODE_OF_CONDUCT.md) files in this repository.

## Pull requests

Please follow the recommendations in the main [CONTRIBUTING.md](../../.github/CONTRIBUTING.md) file in this repository before submitting a pull request.
