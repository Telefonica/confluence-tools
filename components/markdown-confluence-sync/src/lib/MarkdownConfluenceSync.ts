// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { ConfigInterface as customMarkdownConfluenceSyncClass } from "@mocks-server/config";
import { resolve } from "path";
import { Config } from "@mocks-server/config";
import type { LoggerInterface } from "@mocks-server/logger";
import { Logger } from "@mocks-server/logger";
import { SyncModes } from "@telefonica/confluence-sync";

import { ConfluenceSync } from "./confluence/ConfluenceSync.js";
import type {
  ConfluenceSyncInterface,
  ConfluenceSyncPage,
} from "./confluence/ConfluenceSync.types.js";
import { MarkdownDocuments } from "./docusaurus/DocusaurusPages.js";
import type {
  MarkdownDocument,
  MarkdownDocumentsInterface,
} from "./docusaurus/DocusaurusPages.types.js";
import type {
  MarkdownConfluenceSyncConstructor,
  MarkdownConfluenceSyncInterface,
  Configuration,
  LogLevelOption,
  LogLevelOptionDefinition,
  ModeOptionDefinition,
  FilesPatternOptionDefinition,
  ModeOption,
  FilesPatternOption,
  FilesMetadataOptionDefinition,
  FilesIgnoreOptionDefinition,
  FilesIgnoreOption,
  FilesMetadataOption,
  ContentPreprocessorOptionDefinition,
  ContentPreprocessorOption,
} from "./MarkdownConfluenceSync.types.js";

const MODULE_NAME = "markdown-confluence-sync";
const MARKDOWN_NAMESPACE = "markdown";
const CONFLUENCE_NAMESPACE = "confluence";

const DEFAULT_CONFIG: Configuration["config"] = {
  readArguments: false,
  readEnvironment: false,
  readFile: false,
};

const logLevelOption: LogLevelOptionDefinition = {
  name: "logLevel",
  type: "string",
  default: "info",
};

const modeOption: ModeOptionDefinition = {
  name: "mode",
  type: "string",
  default: SyncModes.TREE,
};

const filesPatternOption: FilesPatternOptionDefinition = {
  name: "filesPattern",
  type: "string",
};

const filesIgnoreOption: FilesIgnoreOptionDefinition = {
  name: "ignore",
  type: "array",
};

const filesMetadataOption: FilesMetadataOptionDefinition = {
  name: "filesMetadata",
  type: "array",
};

const contentPreprocessorOption: ContentPreprocessorOptionDefinition = {
  name: "preprocessor",
  type: "unknown",
};

export const MarkdownConfluenceSync: MarkdownConfluenceSyncConstructor = class MarkdownConfluenceSync
  implements MarkdownConfluenceSyncInterface
{
  private _markdownDocuments: MarkdownDocumentsInterface;
  private _confluenceSync: ConfluenceSyncInterface;
  private _configuration: customMarkdownConfluenceSyncClass;
  private _initialized = false;
  private _config: Configuration;
  private _logger: LoggerInterface;
  private _logLevelOption: LogLevelOption;
  private _modeOption: ModeOption;
  private _filesPatternOption: FilesPatternOption;
  private _filesMetadataOption: FilesMetadataOption;
  private _filesIgnoreOption: FilesIgnoreOption;
  private _contentPreprocessorOption: ContentPreprocessorOption;
  private _cwd: string;

  constructor(config: Configuration) {
    const cwd = config?.cwd || process.env.MARKDOWN_CONFLUENCE_SYNC_CWD;
    this._cwd = cwd ? resolve(process.cwd(), cwd) : process.cwd();
    this._config = config;
    if (!this._config) {
      throw new Error("Please provide configuration");
    }

    this._configuration = new Config({
      moduleName: MODULE_NAME,
    });

    this._logger = new Logger(MODULE_NAME);
    this._logLevelOption = this._configuration.addOption(
      logLevelOption,
    ) as LogLevelOption;
    this._modeOption = this._configuration.addOption(modeOption) as ModeOption;
    this._filesPatternOption = this._configuration.addOption(
      filesPatternOption,
    ) as FilesPatternOption;

    this._filesMetadataOption = this._configuration.addOption(
      filesMetadataOption,
    ) as FilesMetadataOption;

    this._filesIgnoreOption = this._configuration.addOption(
      filesIgnoreOption,
    ) as FilesIgnoreOption;

    this._contentPreprocessorOption = this._configuration.addOption(
      contentPreprocessorOption as ContentPreprocessorOptionDefinition,
    ) as unknown as ContentPreprocessorOption;

    const markdownLogger = this._logger.namespace(MARKDOWN_NAMESPACE);

    const confluenceConfig =
      this._configuration.addNamespace(CONFLUENCE_NAMESPACE);
    const confluenceLogger = this._logger.namespace(CONFLUENCE_NAMESPACE);

    this._markdownDocuments = new MarkdownDocuments({
      config: this._configuration,
      logger: markdownLogger,
      mode: this._modeOption,
      filesPattern: this._filesPatternOption,
      filesIgnore: this._filesIgnoreOption,
      filesMetadata: this._filesMetadataOption,
      contentPreprocessor: this._contentPreprocessorOption,
      cwd: this._cwd,
    });
    this._confluenceSync = new ConfluenceSync({
      config: confluenceConfig,
      logger: confluenceLogger,
      mode: this._modeOption,
    });
  }

  public async sync(): Promise<void> {
    await this._init();
    const pages = await this._markdownDocuments.read();
    await this._confluenceSync.sync(
      this._markdownPagesToConfluencePages(pages),
    );
  }

  private async _init() {
    if (!this._initialized) {
      // NOTE: We delete the cwd property from the configuration because it can be configured only programmatically. It is not a configuration option.
      const configToLoad = {
        ...this._config,
        cwd: undefined,
        config: {
          ...DEFAULT_CONFIG,
          ...{
            fileSearchFrom: this._cwd,
            fileSearchStop: this._cwd,
          },
          ...this._config.config,
        },
      };

      delete configToLoad.cwd;

      this._logger.debug(
        `Initializing with config: ${JSON.stringify(configToLoad)}`,
      );

      await this._configuration.load(configToLoad);
      this._logger.setLevel(this._logLevelOption.value);
      this._initialized = true;
    }
  }

  private _markdownPagesToConfluencePages(
    markdownDocuments: MarkdownDocument[],
  ): ConfluenceSyncPage[] {
    this._logger.info(
      `Converting ${markdownDocuments.length} markdown documents to Confluence pages...`,
    );
    return markdownDocuments;
  }
};
