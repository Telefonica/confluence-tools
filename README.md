[![Build status][https://github.com/Telefonica/confluence-tools/workflows/build/badge.svg?branch=main]][https://github.com/Telefonica/confluence-tools/actions?query=workflow%3Abuild+branch%3Amain] [![Last commit][https://img.shields.io/github/last-commit/Telefonica/confluence-tools.svg]][https://github.com/Telefonica/confluence-tools/commits] [![Last release][https://img.shields.io/github/release-date/Telefonica/confluence-tools.svg]][https://github.com/Telefonica/confluence-tools/releases]

# Confluence tools

This repository contains a set of tools that can be used to interact with Confluence.

They are distributed as NPM packages. Please refer to the documentation of each package for more information.

## Main packages

* [Markdown Confluence Sync](components/markdown-confluence-sync/README.md): A tool to __synchronize a folder containing Markdown files with Confluence pages__. Supports Mermaid diagrams and per-page configuration using [frontmatter metadata](https://jekyllrb.com/docs/front-matter/). Works great with [Docusaurus](https://docusaurus.io/).
* [Confluence Sync](components/confluence-sync/README.md): A tool that __creates/updates/deletes Confluence pages based on a list of objects containing the page contents__. Supports nested pages and attachments upload.

## Other tools

These tools are used by the main packages, but are also published as separate packages:

* [child-process-manager](components/child-process-manager/README.md): A tool to manage child processes. Useful to execute shell commands from tests and check their output, for example.

## Internal tools

Some other components in the repository are not published, because they are used only in the development of the main packages:

* [eslint-config](components/eslint-config/README.md): Base configuration for ESLint, enabling to extend it on each different component.
* [cspell-config](components/cspell-config/README.md): Base configuration for cspell, enabling to extend it on each different component.

## Contributing

Please read our [Contributing Guidelines](./.github/CONTRIBUTING.md) for details on how to contribute to this project before submitting a pull request.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](./LICENSE) file for details.
