// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { LogLevel, LoggerInterface } from "@mocks-server/logger";

import type {
  ConfluencePage,
  ConfluencePageBasicInfo,
  ConfluenceId,
  ConfluenceClientAuthenticationConfig,
} from "./confluence/CustomConfluenceClient.types";

export enum SyncModes {
  TREE = "tree",
  FLAT = "flat",
  ID = "id",
}

/** Type for dictionary values */
export type ConfluencePagesDictionaryItem = {
  /** Confluence page id */
  id: ConfluenceId;
  /** Confluence page title */
  title: string;
  /** Confluence page version */
  version: number;
  /** Confluence page ancestors */
  ancestors?: ConfluencePageBasicInfo[];
  /** Boolean to indicate if the page was updated */
  visited?: boolean;
};

/** Type of input pages */
export type ConfluenceInputPage = {
  /** Input page id */
  id?: ConfluenceId;
  /** Input page title */
  title: string;
  /** Input page content */
  content?: string;
  /** Input page ancestors */
  ancestors?: string[];
  /** Input page attachments */
  attachments?: Record<string, string>;
};

/** Confluence page dictionary */
export type ConfluencePagesDictionary = Record<
  string,
  ConfluencePagesDictionaryItem
>;

export interface ConfluenceSyncPagesConfig {
  /** Confluence url */
  url: string;
  /** Confluence space id */
  spaceId: string;
  /** Confluence page under which all pages will be synced */
  rootPageId?: ConfluenceId;
  /**
   * Confluence personal access token. Use authentication.oauth2.accessToken instead
   * @deprecated Use authentication.oauth2.accessToken instead
   */
  personalAccessToken?: string;
  /** Authentication configuration */
  authentication?: ConfluenceClientAuthenticationConfig;
  /** Log level */
  logLevel?: LogLevel;
  /** Dry run option */
  dryRun?: boolean;
  /** Sync mode */
  syncMode?: SyncModes;
}

/** Creates a ConfluenceSyncPages interface */
export interface ConfluenceSyncPagesConstructor {
  /** Returns ConfluenceSyncPages interface
   * @param config - Config for creating a ConfluenceSyncPages interface {@link ConfluenceSyncPagesConfig}.
   * @returns ConfluenceSyncPages instance {@link ConfluenceSyncPagesInterface}.
   * @example const confluenceSyncPages = new ConfluenceSyncPages({ personalAccessToken: "foo", url: "https://bar.com", spaceId: "CTO", rootPageId: "foo-root-id"});
   */
  new (config: ConfluenceSyncPagesConfig): ConfluenceSyncPagesInterface;
}

export interface ConfluenceSyncPagesInterface {
  /** Library logger. You can attach events, consult logs store, etc. */
  logger: LoggerInterface;
  /** Sync pages in Confluence.
   * @param pages - Pages data {@link ConfluenceInputPage}.
   */
  sync(pages: ConfluenceInputPage[]): Promise<void>;
}

export interface ConfluenceSyncPagesCreateTask {
  type: "create";
  page: ConfluenceInputPage;
}

export interface ConfluenceSyncPagesInitSyncTask {
  type: "init";
  pageId: string;
}

export interface ConfluenceSyncPagesUpdateTask {
  type: "update";
  pageId: string;
  page: ConfluenceInputPage;
}

export interface ConfluenceSyncPagesDeleteTask {
  type: "delete";
  pageId: string;
}

export interface ConfluenceSyncPagesCreateAttachmentsTask {
  type: "createAttachments";
  pageId: string;
  pageTitle: string;
  attachments: Record<string, string>;
}

export interface ConfluenceSyncPagesDeleteAttachmentsTask {
  type: "deleteAttachments";
  pageId: string;
}

export type ConfluenceSyncPagesTask =
  | ConfluenceSyncPagesCreateTask
  | ConfluenceSyncPagesInitSyncTask
  | ConfluenceSyncPagesUpdateTask
  | ConfluenceSyncPagesDeleteTask
  | ConfluenceSyncPagesCreateAttachmentsTask
  | ConfluenceSyncPagesDeleteAttachmentsTask;

export interface ConfluenceSyncPagesJob<
  Task extends ConfluenceSyncPagesTask = ConfluenceSyncPagesTask,
> {
  task: Task;
  enqueueTask: (task: ConfluenceSyncPagesTask) => void;
  getConfluencePageByTitle: (pageTitle: string) => ConfluencePage | undefined;
  getPageByTitle: (pageTitle: string) => ConfluenceInputPage | undefined;
  getPagesByAncestor: (
    ancestor: string,
    isRoot?: boolean,
  ) => ConfluenceInputPage[];
  storeConfluencePage: (page: ConfluencePage) => void;
}
