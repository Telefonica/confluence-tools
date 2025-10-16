// SPDX-FileCopyrightText: 2025 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { LoggerInterface } from "@mocks-server/logger";
import type { Models } from "confluence.js";
import { ConfluenceClient } from "confluence.js";
import type {
  ConfluenceClientAuthenticationConfig,
  Attachments,
  ConfluenceClientConfig,
  ConfluenceClientConstructor,
  ConfluenceClientInterface,
  ConfluencePage,
  ConfluencePageBasicInfo,
  ConfluenceId,
  CreatePageParams,
} from "./CustomConfluenceClient.types";

import { AttachmentsNotFoundError } from "./errors/AttachmentsNotFoundError";
import { toConfluenceClientError } from "./errors/AxiosErrors";
import { CreateAttachmentsError } from "./errors/CreateAttachmentsError";
import { CreatePageError } from "./errors/CreatePageError";
import { DeletePageError } from "./errors/DeletePageError";
import { PageNotFoundError } from "./errors/PageNotFoundError";
import { UpdatePageError } from "./errors/UpdatePageError";

const GET_CHILDREN_LIMIT = 100;

/**
 * Type guard to check if the authentication is basic
 * @param auth - Object to check
 * @returns True if the authentication is basic, false otherwise
 */
function isBasicAuthentication(
  auth: ConfluenceClientAuthenticationConfig,
): auth is { basic: { email: string; apiToken: string } } {
  return (
    (auth as { basic: { email: string; apiToken: string } }).basic !== undefined
  );
}

/**
 * Type guard to check if the authentication is OAuth2
 * @param auth - Object to check
 * @returns True if the authentication is OAuth2, false otherwise
 */
function isOAuth2Authentication(
  auth: ConfluenceClientAuthenticationConfig,
): auth is {
  oauth2: { accessToken: string };
} {
  return (auth as { oauth2: { accessToken: string } }).oauth2 !== undefined;
}

/**
 * Type guard to check if the authentication is JWT
 * @param auth - Object to check
 * @returns True if the authentication is JWT, false otherwise
 */
function isJWTAuthentication(
  auth: ConfluenceClientAuthenticationConfig,
): auth is {
  jwt: { issuer: string; secret: string; expiryTimeSeconds?: number };
} {
  return (
    (auth as { jwt: { issuer: string; secret: string } }).jwt !== undefined
  );
}

function isAuthentication(
  auth: unknown,
): auth is ConfluenceClientAuthenticationConfig {
  if (typeof auth !== "object" || auth === null) {
    return false;
  }
  return (
    isBasicAuthentication(auth as ConfluenceClientAuthenticationConfig) ||
    isOAuth2Authentication(auth as ConfluenceClientAuthenticationConfig) ||
    isJWTAuthentication(auth as ConfluenceClientAuthenticationConfig)
  );
}

export const CustomConfluenceClient: ConfluenceClientConstructor = class CustomConfluenceClient
  implements ConfluenceClientInterface
{
  private _config: ConfluenceClientConfig;
  private _client: ConfluenceClient;
  private _logger: LoggerInterface;

  constructor(config: ConfluenceClientConfig) {
    this._config = config;

    if (
      isAuthentication(config.authentication) === false &&
      config.personalAccessToken === undefined
    ) {
      throw new Error(
        "Either authentication or personalAccessToken must be provided",
      );
    }

    const authentication = isAuthentication(config.authentication)
      ? config.authentication
      : {
          oauth2: {
            accessToken: config.personalAccessToken as string,
          },
        };

    this._client = new ConfluenceClient({
      host: config.url,
      authentication,
      apiPrefix: "/rest/",
    });
    this._logger = config.logger;
  }

  // Exposed mainly for testing purposes
  public get logger() {
    return this._logger;
  }

  private async _getChildPages(
    parentId: ConfluenceId,
    start: number = 0,
    otherChildren: Models.Content[] = [],
  ): Promise<Models.Content[]> {
    try {
      this._logger.silly(`Getting child pages of parent with id ${parentId}`);
      const response: Models.ContentChildren =
        await this._client.contentChildrenAndDescendants.getContentChildren({
          id: parentId,
          start,
          limit: GET_CHILDREN_LIMIT,
          expand: ["page"],
        });
      this._logger.silly(
        `Get child pages response of page ${parentId}, starting at ${start}: ${JSON.stringify(response.page, null, 2)}`,
      );

      const childrenResults = response.page?.results || [];
      const size = response.page?.size || 0;

      const allChildren: Models.Content[] = [
        ...otherChildren,
        ...childrenResults,
      ];

      if (start + childrenResults.length < size) {
        const newStart = start + GET_CHILDREN_LIMIT;
        this._logger.silly(
          `There are more child pages of page with id ${parentId}, fetching next page starting from ${newStart}`,
        );
        return this._getChildPages(parentId, newStart, allChildren);
      }

      return allChildren;
    } catch (error) {
      throw new PageNotFoundError(parentId, { cause: error });
    }
  }

  public async getPage(id: string): Promise<ConfluencePage> {
    try {
      this._logger.silly(`Getting page with id ${id}`);

      const childrenRequest: Promise<Models.Content[]> =
        this._getChildPages(id);

      const pageRequest: Promise<Models.Content> =
        this._client.content.getContentById({
          id,
          expand: ["ancestors", "version.number"],
        });

      const [response, childrenResponse] = await Promise.all([
        pageRequest,
        childrenRequest,
      ]);

      this._logger.silly(
        `Get page response: ${JSON.stringify(response, null, 2)}`,
      );
      this._logger.silly(
        `Get children response: ${JSON.stringify(childrenResponse, null, 2)}`,
      );
      return {
        title: response.title,
        id: response.id,
        version: response.version?.number as number,
        ancestors: response.ancestors?.map((ancestor) =>
          this._convertToConfluencePageBasicInfo(ancestor),
        ),
        children: childrenResponse.map((child) =>
          this._convertToConfluencePageBasicInfo(child),
        ),
      };
    } catch (error) {
      if (!(error instanceof PageNotFoundError)) {
        throw new PageNotFoundError(id, { cause: error });
      }
      throw error;
    }
  }

  public async createPage({
    title,
    content,
    ancestors,
  }: CreatePageParams): Promise<ConfluencePage> {
    if (!this._config.dryRun) {
      const createContentBody = {
        type: "page",
        title,
        space: {
          key: this._config.spaceId,
        },
        ancestors: this.handleAncestors(ancestors),
        body: {
          storage: {
            value: content || "",
            representation: "storage",
          },
        },
      };
      try {
        this._logger.silly(`Creating page with title ${title}`);
        const response =
          await this._client.content.createContent(createContentBody);
        this._logger.silly(
          `Create page response: ${JSON.stringify(response, null, 2)}`,
        );

        return {
          title: response.title,
          id: response.id,
          version: response.version?.number as number,
          ancestors: response.ancestors?.map((ancestor) =>
            this._convertToConfluencePageBasicInfo(ancestor),
          ),
        };
      } catch (e) {
        const error = toConfluenceClientError(e);
        throw new CreatePageError(title, { cause: error });
      }
    } else {
      this._logger.info(`Dry run: creating page with title ${title}`);
      return {
        title,
        id: "1234",
        version: 1,
        ancestors,
      };
    }
  }

  public async updatePage({
    id,
    title,
    content,
    version,
    ancestors,
  }: ConfluencePage): Promise<ConfluencePage> {
    if (!this._config.dryRun) {
      const updateContentBody = {
        id,
        type: "page",
        title,
        ancestors: this.handleAncestors(ancestors),
        version: {
          number: version,
        },
        body: {
          storage: {
            value: content || "",
            representation: "storage",
          },
        },
      };
      try {
        this._logger.silly(`Updating page with title ${title}`);
        const response =
          await this._client.content.updateContent(updateContentBody);
        this._logger.silly(
          `Update page response: ${JSON.stringify(response, null, 2)}`,
        );

        return {
          title: response.title,
          id: response.id,
          version: response.version?.number as number,
          ancestors: response.ancestors?.map((ancestor) =>
            this._convertToConfluencePageBasicInfo(ancestor),
          ),
        };
      } catch (e) {
        const error = toConfluenceClientError(e);
        throw new UpdatePageError(id, title, { cause: error });
      }
    } else {
      this._logger.info(`Dry run: updating page with title ${title}`);
      return {
        title,
        id,
        version,
        ancestors,
      };
    }
  }

  public async deleteContent(id: ConfluenceId): Promise<void> {
    if (!this._config.dryRun) {
      try {
        this._logger.silly(`Deleting content with id ${id}`);
        await this._client.content.deleteContent({ id });
      } catch (error) {
        throw new DeletePageError(id, { cause: error });
      }
    } else {
      this._logger.info(`Dry run: deleting content with id ${id}`);
    }
  }

  public async getAttachments(
    id: ConfluenceId,
  ): Promise<ConfluencePageBasicInfo[]> {
    try {
      this._logger.silly(`Getting attachments of page with id ${id}`);
      const response = await this._client.contentAttachments.getAttachments({
        id,
      });
      this._logger.silly(
        `Get attachments response: ${JSON.stringify(response, null, 2)}`,
      );
      return (
        response.results?.map((attachment) => ({
          id: attachment.id,
          title: attachment.title,
        })) || []
      );
    } catch (error) {
      throw new AttachmentsNotFoundError(id, { cause: error });
    }
  }

  public async createAttachments(
    id: ConfluenceId,
    attachments: Attachments,
  ): Promise<void> {
    if (!this._config.dryRun) {
      try {
        const bodyRequest = attachments.map((attachment) => ({
          minorEdit: true,
          ...attachment,
        }));
        this._logger.silly(
          `Creating attachments of page with id ${id}, attachments: ${attachments
            .map((attachment) => attachment.filename)
            .join(", ")}`,
        );
        const response =
          await this._client.contentAttachments.createAttachments({
            id,
            attachments: bodyRequest,
          });
        this._logger.silly(
          `Create attachments response: ${JSON.stringify(response, null, 2)}`,
        );
      } catch (error) {
        throw new CreateAttachmentsError(id, { cause: error });
      }
    } else {
      this._logger
        .info(`Dry run: creating attachments of page with id ${id}, attachments: ${attachments
        .map((attachment) => attachment.filename)
        .join(", ")}
        `);
    }
  }

  private handleAncestors(
    ancestors?: ConfluencePageBasicInfo[],
  ): { id: string }[] | undefined {
    if (ancestors && ancestors.length) {
      const id = ancestors.at(-1)?.id as string;
      return [{ id }];
    } else {
      return undefined;
    }
  }

  private _convertToConfluencePageBasicInfo(
    rawInfo: Models.Content,
  ): ConfluencePageBasicInfo {
    return {
      id: rawInfo.id,
      title: rawInfo.title,
    };
  }
};
