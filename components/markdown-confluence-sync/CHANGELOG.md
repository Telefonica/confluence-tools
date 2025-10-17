# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

#### Added
#### Changed
#### Fixed
#### Deprecated
#### Removed

## [2.2.0] - 2025-10-17

### Added

* feat: Update confluence-sync to 2.1.0. Add authentication options (OAuth2, Basic, JWT). Deprecate personalAccessToken.
* feat: Add warning when using the deprecated personalAccessToken option.

## [2.1.1] - 2025-07-11

### Fixed

* fix: Fix issue when a page has more than 25 children. There was an error when trying to update a children page that had 25 brothers. The API was not returning it as a child of the parent page, so the library was trying to create it as a new page instead of updating it. Now, we use another API call to get all children pages.


## [2.1.0] - 2025-06-10

### Added

* feat: Add `dryRun` option, enabling to run the sync process without actually sending the content to Confluence. This is useful for testing the configuration and markdown files without making changes in Confluence.

## [2.0.1] - 2025-04-15

### Changed

* docs: Fix badges in README

## [2.0.0] - 2025-04-08

### Changed

* chore: Publish to npm. Rename package to `@telefonica/markdown-confluence-sync`.

## [1.2.1] - 2025-03-20

### Fixed

* fix: Add `ignore` option to the TypeScript typings

## [1.2.0] - 2025-03-19

### Added

* feat: Add `ignore` option, enabling to define an array of globule patterns to ignore files when syncing them to Confluence. It is applied in any sync mode.

### Fixed

* fix: Images with absolute URLs were producing an error when syncing to Confluence.

### Changed

* chore: Manage concurrency in sync-to-confluence workflow

## [1.1.1] - 2025-03-18

### Fixed

* fix: `preprocessor` option was not being applied to the full hierarchy in tree mode. It was working only in pages at first level.

## [1.1.0] - 2025-03-13

### Added

* feat: Add `preprocessor` option, enabling to define a function that preprocesses the file content before converting it to Confluence content.

## [1.0.1] - 2025-02-20

### Changed

* chore: Change copyright headers

## [1.0.0] - 2025-01-22

### Added

* feat: Add id mode. Upgrade confluence-sync to 1.0.0.
* feat: Add filesMetadata option, enabling to defined the metadata of the files using the configuration file.

### Changed

* chore: Remove frontmatter properties from docs. Use filesMetadata instead to define the metadata of the files when syncing them to Confluence.

## [1.0.0-beta.4] - 2024-11-28

### Added

* feat: Add cwd option, enabling to change the working directory from where to load the configuration file, and resolve the docsDir and filesPattern paths.


## [1.0.0-beta.3] - 2024-11-27

### Added

* docs: Add `confluence_id` property to the per-page configuration docs.

### Changed

* feat: Change logs to use "markdown files" instead of "docusaurus pages"
* refactor: Rename first level types and classes to use Markdown instead of Docusaurus.
* docs: Explain clearer the usage of the `confluence_title` property in frontmatter.


## [1.0.0-beta.2] - 2024-11-26

### Added

* feat: Log possible error when trying to parse a markdown file
* docs: Add markdown frontmatter examples
* docs: Add examples of supported config files
* docs: Add link to Confluence Sync documentation

### Fixed

* fix: Fix missed dependencies that were defined as devDependencies
* fix: Add missing supported configuration options to TypeScript typings

## [1.0.0-beta.1] [YANKED]

### Added

* feat: Initial release
