// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { relative } from "node:path";

import type { LoggerInterface } from "@mocks-server/logger";
import { glob } from "glob";
import globule from "globule";

import type {
  ContentPreprocessor,
  FilesMetadata,
  FilesPattern,
} from "../MarkdownConfluenceSync.types.js";
import { isStringWithLength } from "../support/typesValidations.js";

import type {
  MarkdownFlatDocumentsConstructor,
  MarkdownFlatDocumentsOptions,
} from "./DocusaurusFlatPages.types.js";
import type {
  MarkdownDocument,
  MarkdownDocumentsInterface,
} from "./DocusaurusPages.types.js";
import { MarkdownDocFactory } from "./pages/DocusaurusDocPageFactory.js";
import { SyncModes } from "@telefonica/confluence-sync";

export const MarkdownFlatDocuments: MarkdownFlatDocumentsConstructor = class MarkdownFlatDocuments
  implements MarkdownDocumentsInterface
{
  private _cwd: string;
  private _logger: LoggerInterface;
  private _initialized = false;
  private _filesPattern: FilesPattern;
  private _filesIgnore?: FilesPattern;
  private _filesMetadata?: FilesMetadata;
  private _mode: SyncModes.FLAT | SyncModes.ID;
  private _contentPreprocessor?: ContentPreprocessor;

  constructor({
    logger,
    filesPattern,
    filesIgnore,
    filesMetadata,
    cwd,
    mode,
    contentPreprocessor,
  }: MarkdownFlatDocumentsOptions) {
    this._mode = mode;
    this._cwd = cwd;
    this._filesPattern = filesPattern as FilesPattern;
    this._filesIgnore = filesIgnore;
    this._filesMetadata = filesMetadata;
    this._contentPreprocessor = contentPreprocessor;
    this._logger = logger.namespace("doc-flat");
  }

  public async read(): Promise<MarkdownDocument[]> {
    await this._init();
    const filesPaths = await this._obtainedFilesPaths();
    this._logger.debug(
      `Found ${filesPaths.length} files in ${this._cwd} matching the pattern '${this._filesPattern}'`,
    );
    return await this._transformFilePathsToMarkdownDocuments(filesPaths);
  }

  private async _obtainedFilesPaths(): Promise<string[]> {
    return await glob(this._filesPattern, {
      cwd: this._cwd,
      absolute: true,
      // @ts-expect-error The globule types are not compatible with the glob types
      ignore: {
        ignored: (p) => {
          return (
            !/\.mdx?$/.test(p.name) ||
            (this._filesIgnore &&
              globule.isMatch(
                this._filesIgnore,
                // cspell:disable-next-line
                relative(this._cwd, p.fullpath()),
              ))
          );
        },
      },
    });
  }

  private async _transformFilePathsToMarkdownDocuments(
    filesPaths: string[],
  ): Promise<MarkdownDocument[]> {
    const files = filesPaths.map((filePath) =>
      MarkdownDocFactory.fromPath(filePath, {
        logger: this._logger,
        filesMetadata: this._filesMetadata,
        contentPreprocessor: this._contentPreprocessor,
      }),
    );
    const pages = files.map<MarkdownDocument>((item) => ({
      title: item.meta.confluenceTitle || item.meta.title,
      id: item.meta.confluencePageId,
      path: item.path,
      relativePath: relative(this._cwd, item.path),
      content: item.content,
      ancestors: [],
      name: item.meta.confluenceShortName,
    }));
    this._logger.debug(`Found ${pages.length} pages in ${this._cwd}`);
    return pages;
  }

  private _init() {
    if (!this._initialized) {
      if (!isStringWithLength(this._filesPattern as string)) {
        throw new Error(`File pattern can't be empty in ${this._mode} mode`);
      }
      this._filesPattern = this._filesPattern as FilesPattern;
      this._initialized = true;
    }
  }
};
