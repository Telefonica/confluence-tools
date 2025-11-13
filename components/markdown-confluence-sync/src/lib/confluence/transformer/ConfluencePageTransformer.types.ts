// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { LoggerInterface } from "@mocks-server/logger";
import type { ConfluenceInputPage } from "@telefonica/confluence-sync";

import type { ConfluenceSyncPage } from "../ConfluenceSync.types.js";

export interface RehypePluginOptions {
  /**
   * Enable code blocks transformation to Confluence code macro.
   * When enabled, markdown code blocks will be converted to Confluence's
   * structured code macro format with syntax highlighting support.
   * @default true
   */
  codeBlocks?: boolean;
}

export interface ConfluencePageTransformerOptions {
  /** Confluence page notice message */
  noticeMessage?: string;
  /** Confluence page notice template */
  noticeTemplate?: string;
  /**
   * Confluence root page short name to be added to children titles
   *
   * @example
   * const confluenceSyncPages = new ConfluenceSyncPages({..., rootPageName: "My Root Page" });
   * confluenceSyncPages.sync([{ title: "My Page" }]);
   * // Will create a page with title "[My Root Page] My Page"
   */
  rootPageName?: string;
  /** Confluence space key */
  spaceKey: string;
  /** Logger */
  logger?: LoggerInterface;
  /** Rehype plugin options */
  rehype?: RehypePluginOptions;
}

/** Creates a ConfluencePageTransformer interface */
export interface ConfluencePageTransformerConstructor {
  /** Returns ConfluencePageTransformer interface
   * @returns ConfluencePageTransformer instance {@link ConfluencePageTransformerInterface}.
   */
  new (
    options: ConfluencePageTransformerOptions,
  ): ConfluencePageTransformerInterface;
}

export interface ConfluencePageTransformerInterface {
  /** Transform pages from markdown to Confluence
   * @param documents - Markdown documents
   * @returns Confluence pages
   */
  transform(documents: ConfluenceSyncPage[]): Promise<ConfluenceInputPage[]>;
}

export interface ConfluencePageTransformerTemplateData {
  /** Confluence page relative path to docs dir */
  relativePath: string;
  /** Confluence page relative path to docs dir without file extension */
  relativePathWithoutExtension: string;
  /** Confluence page title */
  title: string;
  /** Confluence page notice message */
  message: string;
  /** Confluence default page notice message */
  default: string;
}
