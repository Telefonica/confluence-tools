# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

#### Added
#### Changed
#### Fixed
#### Deprecated
#### Removed

## [2.0.0] - 2025-04-08

### Changed

* chore: Publish to npm. Rename package to `@telefonica/confluence-sync`.

## [1.0.1] - 2025-02-20

### Changed

* chore: Change copyright headers

## [1.0.0] - 2025-01-22

### Added

* feat: Add "id" mode, which only allows to update pages by its Confluence page ID. It throws when there is a page without an ID or with an ancestor, or when rootPageId is provided.
* feat: Do not allow "flat" mode when all pages have an id. "id" mode should be used instead.
* feat: Validate sync modes at the very beginning. It throws when a non-existing mode is provided.

## [1.0.0-beta.1]

### Added

* feat: Initial release
