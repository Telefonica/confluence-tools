// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { LoggerInterface } from "@mocks-server/logger";

export type ConfluenceId = string;
export type ConfluencePageBasicInfo = Pick<ConfluencePage, "id" | "title">;
export type CreatePageParams = Pick<
  ConfluencePage,
  "title" | "content" | "ancestors"
>;
export type Attachments = Attachment[];

interface Attachment {
  filename: string;
  file: Buffer;
}
export interface ConfluencePage {
  /** Page title */
  title: string;
  /** Page id */
  id: ConfluenceId;
  /** Page version */
  version: number;
  /** Page content */
  content?: string;
  /** Page ancestor */
  ancestors?: ConfluencePageBasicInfo[];
  /** Page children */
  children?: ConfluencePageBasicInfo[];
}

export type ConfluenceClientBasicAuthenticationConfig = {
  basic: {
    /** Basic auth email */
    email: string;
    /** Basic auth API token */
    apiToken: string;
  };
};

export type ConfluenceClientOAuth2AuthenticationConfig = {
  oauth2: {
    /** OAuth2 access token */
    accessToken: string;
  };
};

export type ConfluenceClientJWTAuthenticationConfig = {
  jwt: {
    /** JWT issuer */
    issuer: string;
    /** JWT secret */
    secret: string;
    /** JWT expiry time in seconds */
    expiryTimeSeconds?: number;
  };
};

export type ConfluenceClientAuthenticationConfig =
  | ConfluenceClientBasicAuthenticationConfig
  | ConfluenceClientOAuth2AuthenticationConfig
  | ConfluenceClientJWTAuthenticationConfig;

/** Config for creating a Confluence client */
export interface ConfluenceClientConfig {
  /**
   * Confluence personal access token
   * @deprecated Use authentication.oauth2.accessToken instead
   **/
  personalAccessToken?: string;
  /** Confluence authentication configuration */
  authentication?: ConfluenceClientAuthenticationConfig;
  /** Confluence url */
  url: string;
  /** Confluence space id */
  spaceId: string;
  /** Logger */
  logger: LoggerInterface;
  /** Dry run */
  dryRun?: boolean;
}

/** Creates a ConfluenceClient interface */
export interface ConfluenceClientConstructor {
  /** Returns ConfluenceClient interface
   * @param config - Config for creating a Confluence client {@link ConfluenceClientConfig}.
   * @returns ConfluenceClient instance {@link ConfluenceClientInterface}.
   * @example const confluenceClient = new ConfluenceClient({ personalAccessToken: "foo", url: "https://bar.com", spaceId: "CTO", parentPageId: "foo-page-id"});
   */
  new (config: ConfluenceClientConfig): ConfluenceClientInterface;
}

export interface ConfluenceClientInterface {
  /** Library logger. You can attach events, consult logs store, etc. */
  logger: LoggerInterface;
  /** Returns a page in Confluence
   * @param key - Page key.
   * @returns Page data {@link ConfluencePage}.
   * @example const page = await confluenceClient.getPage("foo-page-id");
   */
  getPage(key: string): Promise<ConfluencePage>;

  /** Creates a page in Confluence
   * @param page - Page data {@link ConfluencePage}.
   * @returns Page data {@link ConfluencePage}.
   */
  createPage(page: CreatePageParams): Promise<ConfluencePage>;

  /** Updates a page in Confluence
   * @param page - Page data {@link ConfluencePage}.
   * @returns Page data {@link ConfluencePage}.
   */
  updatePage(page: ConfluencePage): Promise<ConfluencePage>;

  /** Deletes a page in Confluence
   * @param id - Id of the page to delete.
   */
  deleteContent(id: ConfluenceId): Promise<void>;

  /** Gets all the attachments of a page in Confluence
   * @param id - Id of the page to get the attachments from.
   * @returns Attachments data.
   * @example const attachments = await confluenceClient.getAttachments("foo-page-id");
   */
  getAttachments(id: ConfluenceId): Promise<ConfluencePageBasicInfo[]>;

  /** Creates all the attachments of a page in Confluence
   * @param id - Id of the page to attach the file to.
   * @param attachments - Attachments to create.
   */
  createAttachments(id: ConfluenceId, attachments: Attachments): Promise<void>;
}
