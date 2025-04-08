// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { ConfigInterface } from "@mocks-server/config";
import type { LoggerInterface } from "@mocks-server/logger";
import type { SyncModes } from "@telefonica/confluence-sync";

import type { ContentPreprocessor, FilesMetadata, FilesPattern } from "..";

import type { MarkdownDocumentsInterface } from "./DocusaurusPages.types";

export interface MarkdownDocumentsFactoryOptions {
  /** Content preprocessor */
  contentPreprocessor?: ContentPreprocessor;
  /** Configuration interface */
  config: ConfigInterface;
  /** Logger */
  logger: LoggerInterface;
  /**  Markdown document path */
  path: string;
  /** Pattern to search files when flat mode is active */
  filesPattern?: FilesPattern;
  /** Pattern with files to be ignored */
  filesIgnore?: FilesPattern;
  /** Metadata for specific files */
  filesMetadata?: FilesMetadata;
  /** Working directory */
  cwd: string;
}

/**
 * Factory for creating MarkdownDocuments instances.
 *
 *
 * @export MarkdownDocumentFactory
 */
export interface MarkdownDocumentsFactoryInterface {
  /**
   * Creates a new page from the category index.
   *
   * If the mode is flat will be obtained pages in flat mode.
   * Otherwise, the will be  obtained pages in tree mode.
   *
   * @param options The options to obtained markdown documents.
   *
   * @returns A new MarkdownDocumentsInterface instance.
   */
  fromMode(
    mode: SyncModes,
    options: MarkdownDocumentsFactoryOptions,
  ): MarkdownDocumentsInterface;
}
