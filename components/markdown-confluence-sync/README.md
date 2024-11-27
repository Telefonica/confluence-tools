# markdown-confluence-sync

Creates/updates/deletes [Confluence](https://www.atlassian.com/es/software/confluence) pages based on markdown files in a directory. Supports Mermaid diagrams and per-page configuration using [frontmatter metadata](https://jekyllrb.com/docs/front-matter/). Works great with [Docusaurus](https://docusaurus.io/).

## Table of Contents

<details>
  <summary>
    <strong>Details</strong>
  </summary>

- [Requirements](#requirements)
  - [Compatibility](#compatibility)
- [Features](#features)
- [Alternatives](#alternatives)
- [Quick start](#quick-start)
  - [Installation](#installation)
  - [Usage](#usage)
- [Sync modes](#sync-modes)
  - [Tree mode](#tree-mode)
    - [Page names](#page-names)
    - [Index files](#index-files)
    - [Category files](#category-files)
    - [Example](#example)
  - [Flat mode](#flat-mode)
- [Configuration](#configuration)
  - [Configuration file](#configuration-file)
  - [Arguments](#arguments)
  - [Environment variables](#environment-variables)
- [Configuration per page](#configuration-per-page)
- [Automation notice](#automation-notice)
- [Markdown conversion](#markdown-conversion)
  - [Supported features](#supported-features)
  - [Unsupported features](#unsupported-features)
  - [Docusaurus compatibility](#docusaurus-compatibility)
- [Programmatic usage](#programmatic-usage)
  - [API](#api)
- [Contributing](#contributing)
- [License](#license)

</details>

## Requirements

In order to be able to sync the markdown files with Confluence, you need to have the following:

* A [Confluence](https://www.atlassian.com/es/software/confluence) instance.
* The id of the Confluence space where the pages will be created.
* A personal access token to authenticate. You can create a personal access token following the instructions in the [Atlassian documentation](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/).
* A folder containing the markdown files to be synced with Confluence. It can be a Docusaurus project docs folder.

### Compatibility

> [!IMPORTANT]
> This library has been tested only with Confluence 8.5.x. It may work with other versions, but it has not been tested.

## Features

The library reads the markdown files in a given folder and create/delete/update the corresponding Confluence pages following the same hierarchical structure under a provided Confluence page depending on the [synchronization mode](#sync-modes) to use.

> [!IMPORTANT]
> Markdown documents to be synced __must have [frontmatter metadata](https://jekyllrb.com/docs/front-matter/)__ with at least next properties:
> * `title` property, used to give a title to the page in Confluence.
> * `sync_to_confluence` property set to `true`

```markdown
---
title: Page title
sync_to_confluence: true
---

# Page content

Hello, world! I'm a markdown file to be synced with Confluence.
```

The library has __two modes for syncing__:
* `tree` sync mode - Mirrors the hierarchical pages structure from given folder under a Confluence root page. Some files are used for [representing indices in the hierarchy](#index-files).
* `flat` sync mode - Synchronize a list of markdown files matched by a [glob pattern](https://github.com/isaacs/node-glob#glob-primer) as children page of a Confluence root page, without any hierarchy.
  * As an extra in this mode, a Confluence id can be provided to each page using the frontmatter, and, in such case, the corresponding Confluence page will be updated. Read [per-page configuration](#configuration-per-page) for more information.

Other features are:

* The library adds a __notice message at the beginning of every pages content__ indicating that it has been generated automatically. Read [Automation notice](#automation-notice) for more information.
* Converts Mermaid diagrams to images.
* Supports __configuration per page using [frontmatter metadata](https://jekyllrb.com/docs/front-matter/).__ Some of the things you can configure are:
  * Title of the page in Confluence.
  * Adding ancestors title to every page title.

## Alternatives

* [Markdown-Confluence-CLI](https://github.com/markdown-confluence/markdown-confluence/tree/main/packages/cli) - A CLI tool to sync markdown files with Confluence. It converts the markdown files to [ADF format](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/) and sends them to Confluence. Some Confluence versions do not work well with ADF format, so it may not work in all cases.
* [Markdown-to-Confluence](https://github.com/duo-labs/markdown-to-confluence) - A CLI tool to sync markdown files with Confluence made in Python. It uses the Confluence REST API to create pages. It seems to not support hierarchical structures, or Mermaid diagrams.

## Quick start

### Installation

First of all, you need to __get permissions to install the package__. Please follow the instructions in the [Confluence page about NPM packages](https://confluence.tid.es/display/CTO/%5BCross%5D+NPM+Packages).

Then, you can install the package using npm:

```bash
npm install @tid-xcut/markdown-confluence-sync
```

### Usage

The library provides an NPM binary named `markdown-confluence-sync`. To use it, you can add a script like this to your `package.json` file:

```json title="package.json"
{
  "scripts": {
    "sync": "markdown-confluence-sync"
  }
}
```

All the markdown files to be synced must have frontmatter properties "title" and "sync_to_confluence" set to `true`. For example:

```markdown
---
title: Page title
sync_to_confluence: true
---

# Page content

Hello, world! I'm a markdown file to be synced with Confluence.
```

As a starting point, you can create a `markdown-confluence-sync.config.js` file in the root of your project with the following content (read the [Configuration](#configuration) section for more information and other configuration methods):

```js title="markdown-confluence-sync.config.js"
module.exports = {
  docsDir: "docs",
  confluence: {
    url: "https://my-confluence.es",
    personalAccessToken: "*******",
    spaceKey: "MY-SPACE",
    rootPageId: "my-root-page-id"
  }
}
```

Then, you could run the synchronization with:

```sh
npm run sync
```

## Sync modes

The library has two modes for reading markdown files, `tree` and `flat`:

### Tree mode

The `tree` mode will creates a hierarchy based on the markdown files structure in the folder to sync, and send the pages to Confluence respecting it. This is the default mode.

#### Page names

__Confluence requires unique page names within a space__. To meet this requirement, pages are created by combining the titles of their ancestors with their own title. Ancestors refer to parent pages or categories that the page belongs to. For example:
  * If we have a page named `Page C` with ancestors `Category A` and `Category B` it will be created with the title `[Category A][Category B] Page C` in Confluence.

#### Index files

In `tree` mode, some files are used for representing categories in the hierarchy. These files are called **index files** and are used to create a parent page in Confluence. The rest of the files in the same folder will be created as children of the parent page.

These files __represent the content of the category itself and contain it's metadata__. These **index files**, can be one of the following:

* `index.md`
* `index.mdx`
* `README.md`
* `README.mdx`
* Files with same name as the category's folder name (eg: for category with name `categoryA` either `<categoryA>.md` and `<categoryA>.mdx` will be considered indices).

> [!NOTE]
> In presence of multiple index files in a folder, the library will use the first one found in the following order: `index.md`, `index.mdx`, `README.md` and `README.mdx`, and files with same name as the category's folder name with `.md` and `.mdx` extensions. **The rest of the index files will be ignored.**

Other considerations about the **index files**:

* The library uses the **index file** in a folder to create a "parent page" in Confluence. Other docs in the same folder will be created as children of the parent page.
* If the **index file** has not `sync_to_confluence` set to `true` in its frontmatter metadata, the library will stop searching for possible children pages in the folder.
* If the folder does not contain an **index file**, the library will create an empty page in Confluence with the same name as the folder, but only when it has children pages to be synced (other pages in the folder or children folders with `sync_to_confluence` set to `true`).
* **Index file** in the root directory will be ignored. For the moment, the library is only able to create pages from files in root directory and under children folders.

#### Category files

It is possible to specify category item metadata using `_category_.json` or `_category_.yml` files in the respective folder. You can set a `label` field in the file to overwrite the category page title.

Setting this field will overwrite the page title defined in the `index` file, and also the title of the empty page created in Confluence when the folder does not contain an `index` file.

> [!TIP]
> Note that these files are compatible with [Docusaurus category files](https://docusaurus.io/docs/sidebar/autogenerated#category-item-metadata), but the library only uses the `label` field to overwrite the category page title.

#### Example

Here you have an example of a markdown files structure in a repository's docs folder. Each page details the corresponding Confluence page that will be created:

```title="Docusaurus project"
repository/
├── docs/
│   ├── index.md -> IGNORED
│   ├── category-a/
│   │   ├── index.md -> category-a
│   │   ├── page-a.md -> category-a/page-a
│   │   ├── page-b.md -> category-a/page-b
│   │   └── category-b/
│   │       ├── index.md -> category-a/category-b
│   │       ├── page-a.md -> category-a/category-b/page-a
│   │       └── page-b.md -> category-a/category-b/page-b
│   ├── category-c/ -> Empty page created in Confluence as category-c
│   │   ├── page-a.md -> category-c/page-a
│   │   └── page-b.md -> category-c/page-b
│   ├── category-d/ -> Empty page created in Confluence as category-d
│   │   ├── _category_.yml -> Rename category-d title based on the label field
│   ├── category-e/
│   │   ├── _category_.yml -> Rename category-e title based on the label field
│   │   └── index.md -> category-e
│   ├── page-a.md -> page-a
│   └── page-b.md -> page-b
├── markdown-confluence-sync.config.js <- Markdown Confluence Sync configuration
└── package.json
```

> [!TIP]
> You can also read the [Confluence Sync package documentation](https://github.com/Telefonica/cross-confluence-tools/tree/main/components/confluence-sync) for further info about the process of syncing to Confluence.

### Flat mode

The `flat` mode syncs all markdown files matching a [glob pattern](https://github.com/isaacs/node-glob#glob-primer) just under the root Confluence page. It does not create a nested hierarchy.

It also supports defining a Confluence id in the frontmatter metadata of the markdown files. In this case, the library will always update the Confluence page with that id, even when it is not a children of the Confluence root page.

To enable it, you have to set the `mode` property to `flat` in the configuration file, and provide a [glob pattern](https://github.com/isaacs/node-glob#glob-primer) to filter the files to sync using the `filesPattern` property.

> [!WARNING]
> The `filePattern` option searches all files in the directory but filters the pattern results and ignores all files that do not have one of the following extensions: `md` or `mdx`.

For example, with the provided configuration, `flat` synchronization mode will get all files starting with the "check" word, and having the extensions `md` or `mdx`:

```js title="markdown-confluence-sync.config.js"
module.exports = {
  docsDir: "docs",
  confluence: {
    url: "https://my-confluence.es",
    personalAccessToken: "*******",
    spaceKey: "MY-SPACE",
    rootPageId: "my-root-page-id"
  }
}
```

## Configuration

All of the configuration properties can be provided through a configuration file, CLI arguments, or environment variables (Read the [`@mocks-server/config` package](https://github.com/mocks-server/main/tree/master/packages/config) for further info, which is used under the hood).

The namespace for the configuration of this library is `markdown-confluence-sync`, so, for example, to set environment variables you have to prefix the variable name with `MARKDOWN_CONFLUENCE_SYNC_`.

| Property | Type | Description | Default |
| --- | --- | --- | --- |
| `logLevel` | `string` | Log level. One of `silly`, `debug`, `info`, `warn`, `error`, `silent` | `info` |
| `mode` | `string` | Mode to read the pages to send to Confluence. One of `tree`, `flat`.  | `tree` |
| `filesPattern` | `string` | Pattern to read the pages to send to Confluence. This option is mandatory when used `flat` sync mode.  |  |
| `docsDir` | `string` | Path to the docs directory. | `./docs` |
| `confluence.url` | `string` | URL of the Confluence instance. | |
| `confluence.personalAccessToken` | `string` | Personal access token to authenticate against the Confluence instance. | |
| `confluence.spaceKey` | `string` | Key of the Confluence space where the pages will be synced. | |
| `confluence.rootPageId` | `string` | Id of the Confluence parent page where the pages will be synced. | |
| `confluence.rootPageName` | `string` | Customize Confluence page titles by adding a prefix to all of them for improved organization and clarity | |
| `confluence.noticeMessage` | `string` | Notice message to add at the beginning of the Confluence pages. | |
| `confluence.noticeTemplate` | `string` | Template string to use for the notice message. | |
| `confluence.dryRun` | `boolean` | Log create, update or delete requests to Confluence instead of really making them | `false` |
| `config.readArguments` | `boolean` | Read configuration from arguments or not | `false` |
| `config.readFile` | `boolean` | Read configuration from file or not | `false` |
| `config.readEnvironment` | `boolean` | Read configuration from environment or not | `false` |

### Configuration file

As mentioned above, the library supports defining the config in a configuration file. It supports [many patterns for naming the file, as well as file formats](https://github.com/mocks-server/main/tree/master/packages/config#configuration-sources).

Just take into account that the namespace for the configuration is `markdown-confluence-sync`, so, possible configuration files may be:

* `markdown-confluence-sync.config.js`.
* `.markdown-confluence-syncrc.yaml`.
* `.markdown-confluence-syncrc.json`.

> [!TIP]
> Read the [`@mocks-server/config` docs](https://github.com/mocks-server/main/tree/master/packages/config#configuration-sources) for further info about all supported file names and formats of the configuration file.

```js title="markdown-confluence-sync.config.js"
module.exports = {
  docsDir: "docs",
  confluence: {
    url: "https://my-confluence.es",
    personalAccessToken: "*******",
    spaceKey: "MY-SPACE",
    rootPageId: "my-root-page-id"
  }
}
```

### Arguments

Configuration properties can be provided through CLI arguments. The name of the argument is the property name prefixed with `--`. For example, to set the `docsDir` property, you have to set the `--docsDir` argument. For boolean properties with a default value of `true`, you can set the `--no-` prefix to set the property to `false`. For example, to set the `config.readArguments` property to `false`, you have to set the `--no-config.readArguments` argument.

```sh
npx markdown-confluence-sync --docsDir ./docs --logLevel debug
```

### Environment variables

Configuration properties can be provided through environment variables. The name of the variable is the property name prefixed with `MARKDOWN_CONFLUENCE_SYNC_` and converted to uppercase.

For example, to set the `docsDir` property, you have to set the `MARKDOWN_CONFLUENCE_SYNC_DOCS_DIR` environment variable.

```sh
MARKDOWN_CONFLUENCE_SYNC_DOCS_DIR=./docs MARKDOWN_CONFLUENCE_SYNC_LOG=debug npx markdown-confluence-sync
```

## Configuration per page

It is possible to set some properties for each page using the frontmatter metadata in the markdown files. The properties that can be set are:

* `confluence_id` - Confluence id of the page. If set, the library will always update the Confluence page with that id, even when it is not a children of the Confluence root page. __It only can be set in `flat` sync mode.__
* `confluence_title` - Title of the page in Confluence. It will force the title of the page in Confluence to be the value of this property, ignoring the `title` property. Use it if you need to use the `title` property for other purposes (such as in Docusaurus pages), and you don't want to use the same value in Confluence.
* `confluence_short_name` - Adding ancestors title to its children's title may produce an unnecessarily long titles. To avoid this, you can use this property to replace the title of a parent page in its children's title. It should be used only in **index files** for categories.
  For example, if the child's title is "`Page`" and the parent, with the title "`Parent Category`," has the property `confluence_short_name` set to "`Parent`," it will appear in Confluence as follows:
  ```diff
  - [Parent Category] Page
  + [Parent] Page
  ```

## Automation notice

The library adds a notice message at the beginning of every pages content indicating that it has been generated automatically:

```html
<p><strong>AUTOMATION NOTICE: This page is synced automatically, changes made manually will be lost</strong></p>
```

This message can be customized by using the `confluence.noticeMessage` option. But note that the resultant message will always be wrapped in a `<p>` and a `<strong>` tag.

You can also use the `confluence.noticeTemplate` option to provide a custom template for the resulting message. Under the hood, [Handlebars](https://handlebarsjs.com/) is used to provide the next variables to the template for your convenience:
  * `{{relativePath}}`: The relative path of the markdown file that generated the Confluence page.
  * `{{relativePathWithoutExtension}}`: The relative path of the markdown file that generated the Confluence page, but without the file extension.
  * `{{title}}`: The title of the page.
  * `{{message}}`: The message set by `confluence.noticeMessage`.
  * `{{default}}`: The default message.

```js
/** @type {import('@tid-xcut/markdown-confluence-sync').Configuration} */

module.exports = {
  docsDir: "./docs",
  confluence: {
    noticeTemplate:
      '{{default}}. Edit url: <a href="https://github.com/Telefonica/cross-idp/edit/main/components/website-static/docs/{{relativePath}}">Github</a>',
  }
};
```

> [!WARNING]
> **Caveat**: The template is evaluated as **raw HTML** in Confluence, so use it with caution.

## Markdown conversion

Some markdown features that are not easy to convert to Confluence HTML format without defining a custom style for them.

### Supported features

Apart of supporting the most common markdown features, the library also supports the following features:

* [Frontmatter metadata](https://jekyllrb.com/docs/front-matter/) - Frontmatter metadata is removed from the content.
* [Supports MDX files](https://docusaurus.io/docs/mdx) - MDX files are processed, but MDX syntax will be removed, expect for the Docusaurus Tabs tags (read [Docusaurus compatibility](#docusaurus-compatibility) section for more information).
* [Mermaid diagrams](https://github.blog/developer-skills/github/include-diagrams-markdown-files-mermaid/) - Mermaid diagrams are converted to images.
  * The image is generated with `SVG` format, and synced to confluence with a with of 1000 pixels.
  * The plugin generates a SVG image for each diagram and uploads it to Confluence. Then the image is then linked in the page.
  * The images are stored in a folder named `mermaid-diagrams` in the directory of the page.
  * To ignore the autogenerated images in your repository, you can add the following line to your `.gitignore` file:
    ```gitignore
    **/mermaid-diagrams/
    ```
* [Details](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) - Details HTML tags are converted to a Confluence expand macro.
  * The plugin converts the details to an expand macro, and the content of the details is added as the body of the expand macro.
  * The details tag must have a summary tag as its first child. It will be used as the title of the expand macro.
  * The plugin does not support any details properties, like `open`.
  * Do not use mdx syntax inside the details tag (except for tabs tags, which are supported).
  * For example, the following details in a markdown file:
    ```markdown
    <details>
      <summary>Click to expand</summary>
      This is the content of the details.
    </details>
    ```
    will be converted to:
    ```markdown
    <ac:structured-macro ac:name="expand">
      <ac:parameter ac:name="title">Click to expand</ac:parameter>
      <ac:rich-text-body><p>This is the content of the details.</p></ac:rich-text-body>
    </ac:structured-macro>
    ```

### Unsupported features

* [Footnotes](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#footnotes) - Footnotes are removed.

### Docusaurus compatibility

The library is designed to work with [Docusaurus projects](https://docusaurus.io/) without much further configuration, so it also supports some Docusaurus specific features:

* [Admonitions](https://docusaurus.io/docs/markdown-features/admonitions) - Docusaurus admonitions are converted to block quotes keeping their content.
* [Docusaurus MDX code blocks](https://docusaurus.io/docs/i18n/crowdin#mdx-solutions) will be removed, except for the next tags:
  * [Tabs](https://docusaurus.io/docs/markdown-features/tabs) - This is a Docusaurus feature that is not supported by Confluence, so the plugin tries to convert it to a list.
    * The plugin converts the tabs to lists, and the content of each tab is added as a list item.
    * If there are nested tabs, the plugin will add a sub-list to the list item.
    * It is important to mention that the plugin does not support any tab properties, like `groupId`, `values`, or `labels`.
    * The only supported and mandatory property is the `label` property in each tab item. This property is used as the title of the list item.
    * CAUTION: Only tabs in .mdx files are supported. Tabs in .md files are not supported and will cause an error.
    * For example, the following tabs in an MDX file:
      ```markdown
      <Tabs>
        <TabItem value="first" label="First Tab">
          This is the first tab.
        </TabItem>
        <TabItem value="second" label="Second Tab">
          This is the second tab.
        </TabItem>
      </Tabs>
      ```
      will be converted to:
      ```markdown
      - First Tab
        - This is the first tab.
      - Second Tab
        - This is the second tab.
      ```

## Programmatic usage

You can also import the library in your code and use it programmatically. In this case, you have to provide the configuration as an object when creating the instance, and you can call the `sync` method to start the sync process:

```js title="Programmatic usage"
import path from "path";
import { MarkdownConfluenceSync } from '@tid-xcut/markdown-confluence-sync';

const markdownConfluenceSync = new MarkdownConfluenceSync({
  docsDir: path.resolve(__dirname, "..", "docs");
  confluence: {
    url: "https://my.confluence.es",
    personalAccessToken: "*******",
    spaceKey: "MY-SPACE",
    rootPageId: "my-root-page-id"
  }
});

await markdownConfluenceSync.sync();
```

### API

#### `MarkdownConfluenceSync`

This is the main class of the library. It receives the configuration as an object in the constructor. The configuration properties are the same as the ones described in the [Configuration](#configuration) section.

Once it is instantiated, it exposes the following methods:

##### `sync`

This method starts the sync process. It returns a promise that resolves when the sync process finishes.

## Contributing

Please read our [Contributing Guidelines](./CONTRIBUTING.md) for details on how to contribute to this project before submitting a pull request.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](./LICENSE) file for details.
