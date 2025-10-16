# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

#### Added
#### Changed
#### Fixed
#### Deprecated
#### Removed

## Unreleased

### Added

* feat: Add authentication options (OAuth2, Basic, JWT). Deprecate personalAccessToken.

## [2.0.2] - 2025-07-11

### Fixed

* fix: Fix issue when a page has more than 25 children. There was an error when trying to update a children page that had 25 brothers. The API was not returning it as a child of the parent page, so the library was trying to create it as a new page instead of updating it. Now, we call directly to the Confluence API paginated and recursively to get all children pages, so we can update them correctly.

## [2.0.1] - 2025-04-15

### Changed

* docs: Fix badges in README

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
