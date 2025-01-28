// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import type { FilesPattern } from "../MarkdownConfluenceSync.types";
import { SyncModes } from "@tid-xcut/confluence-sync";

import type {
  MarkdownDocumentsInterface,
  MarkdownDocumentsModeOptions,
} from "./DocusaurusPages.types";

export interface MarkdownFlatDocumentsOptions
  extends MarkdownDocumentsModeOptions {
  /** Pattern to search files when flat mode is active */
  filesPattern?: FilesPattern;
  /** Working directory */
  cwd: string;
  /** Mode */
  mode: SyncModes.FLAT | SyncModes.ID;
}

/** Creates a MarkdownFlatDocuments interface */
export interface MarkdownFlatDocumentsConstructor {
  /** Returns MarkdownFlatDocuments interface
   * @param {MarkdownFlatDocumentsOptions} options
   * @returns MarkdownFlatDocuments instance {@link MarkdownDocumentsInterface}.
   */
  new (options: MarkdownFlatDocumentsOptions): MarkdownDocumentsInterface;
}
