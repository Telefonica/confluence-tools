// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { SyncModes } from "@telefonica/confluence-sync";

import { MarkdownFlatDocuments } from "./DocusaurusFlatPages.js";
import type { MarkdownDocumentsInterface } from "./DocusaurusPages.types.js";
import type {
  MarkdownDocumentsFactoryInterface,
  MarkdownDocumentsFactoryOptions,
} from "./DocusaurusPagesFactory.types.js";
import { DocusaurusTreePages } from "./DocusaurusTreePages.js";

export const MarkdownDocumentsFactory: MarkdownDocumentsFactoryInterface = class MarkdownDocumentsFactory {
  public static fromMode(
    mode: SyncModes,
    options: MarkdownDocumentsFactoryOptions,
  ): MarkdownDocumentsInterface {
    if (!this._isValidMode(mode)) {
      throw new Error(`"mode" option must be one of "tree", "flat" or "id"`);
    }
    if (this._isFlatMode(mode) || this._isIdMode(mode)) {
      return new MarkdownFlatDocuments({
        ...options,
        mode: mode as SyncModes.FLAT | SyncModes.ID,
      });
    }
    return new DocusaurusTreePages(options);
  }

  private static _isIdMode(mode: string): boolean {
    return mode === SyncModes.ID;
  }

  private static _isFlatMode(mode: string): boolean {
    return mode === SyncModes.FLAT;
  }

  private static _isValidMode(mode: string): boolean {
    return (
      mode === SyncModes.FLAT ||
      mode === SyncModes.TREE ||
      mode === SyncModes.ID
    );
  }
};
