// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type {
  OptionInterfaceOfType,
  OptionDefinition,
  ConfigInterface,
} from "@mocks-server/config";
import type { LoggerInterface } from "@mocks-server/logger";

import type {
  FilesMetadataOption,
  FilesPatternOption,
  FilesIgnoreOption,
  FilesPattern,
  FilesMetadata,
  ModeOption,
  ContentPreprocessorOption,
  ContentPreprocessor,
} from "../MarkdownConfluenceSync.types.js";

export type MarkdownPageId = string;

type DocsDirOptionValue = string;

declare global {
  //eslint-disable-next-line @typescript-eslint/no-namespace
  namespace MarkdownConfluenceSync {
    interface Config {
      /** Documents directory */
      docsDir?: DocsDirOptionValue;
    }
  }
}

export type DocsDirOptionDefinition = OptionDefinition<
  DocsDirOptionValue,
  { hasDefault: true }
>;

export type DocsDirOption = OptionInterfaceOfType<
  DocsDirOptionValue,
  { hasDefault: true }
>;

export interface MarkdownDocumentsOptions {
  /** Configuration interface */
  config: ConfigInterface;
  /** Logger */
  logger: LoggerInterface;
  /** Sync mode option */
  mode: ModeOption;
  /** Pattern to search files when flat mode is active */
  filesPattern?: FilesPatternOption;
  /** Pattern with files to be ignored */
  filesIgnore?: FilesIgnoreOption;
  /** Metadata for specific files */
  filesMetadata?: FilesMetadataOption;
  /** Preprocessor for content */
  contentPreprocessor: ContentPreprocessorOption;
  /** Working directory */
  cwd: string;
}

/** Data about one markdown file */
export interface MarkdownDocument {
  /** markdown file title */
  title: string;
  /** markdown file path */
  path: string;
  /** markdown file path relative to docs root dir */
  relativePath: string;
  /** markdown file content */
  content: string;
  /** markdown file ancestors */
  ancestors: string[];
  /**
   * markdown file name
   *
   * Replaces title page in children's title.
   */
  name?: string;
}

/** Creates a MarkdownDocuments interface */
export interface MarkdownDocumentsConstructor {
  /** Returns MarkdownDocumentsInterface interface
   * @returns  MarkdownDocuments instance {@link MarkdownDocumentsInterface}.
   */
  new (options: MarkdownDocumentsOptions): MarkdownDocumentsInterface;
}

export interface MarkdownDocumentsInterface {
  /** Read markdown files and return a list of markdown file objects */
  read(): Promise<MarkdownDocument[]>;
}

export interface MarkdownDocumentsModeOptions {
  /** Content preprocessor */
  contentPreprocessor?: ContentPreprocessor;
  /** Metadata for specific files */
  filesMetadata?: FilesMetadata;
  /** Files to be ignored */
  filesIgnore?: FilesPattern;
  /** Configuration interface */
  config: ConfigInterface;
  /** Logger */
  logger: LoggerInterface;
}
