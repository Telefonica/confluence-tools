// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { LoggerInterface } from "@mocks-server/logger";
import type {
  ConfluenceInputPage,
  ConfluenceSyncPagesInterface,
} from "@telefonica/confluence-sync";
import { ConfluenceSyncPages, SyncModes } from "@telefonica/confluence-sync";

import type { ModeOption } from "../MarkdownConfluenceSync.types.js";
import { isStringWithLength } from "../support/typesValidations.js";

import type {
  NoticeMessageOption,
  NoticeMessageOptionDefinition,
  ConfluenceSyncConstructor,
  ConfluenceSyncInterface,
  ConfluenceSyncOptions,
  ConfluenceSyncPage,
  DryRunOption,
  DryRunOptionDefinition,
  PersonalAccessTokenOption,
  PersonalAccessTokenOptionDefinition,
  RootPageIdOption,
  RootPageIdOptionDefinition,
  RootPageNameOption,
  RootPageNameOptionDefinition,
  SpaceKeyOption,
  SpaceKeyOptionDefinition,
  UrlOption,
  UrlOptionDefinition,
  NoticeTemplateOptionDefinition,
  NoticeTemplateOption,
  AuthenticationOptionDefinition,
  AuthenticationOption,
} from "./ConfluenceSync.types.js";
import { ConfluencePageTransformer } from "./transformer/ConfluencePageTransformer.js";
import type { ConfluencePageTransformerInterface } from "./transformer/ConfluencePageTransformer.types.js";
import { PageIdRequiredException } from "./transformer/errors/PageIdRequiredException.js";

const urlOption: UrlOptionDefinition = {
  name: "url",
  type: "string",
};

const personalAccessTokenOption: PersonalAccessTokenOptionDefinition = {
  name: "personalAccessToken",
  type: "string",
};

const spaceKeyOption: SpaceKeyOptionDefinition = {
  name: "spaceKey",
  type: "string",
};

const rootPageIdOption: RootPageIdOptionDefinition = {
  name: "rootPageId",
  type: "string",
};

const rootPageNameOption: RootPageNameOptionDefinition = {
  name: "rootPageName",
  type: "string",
};

const noticeMessageOption: NoticeMessageOptionDefinition = {
  name: "noticeMessage",
  type: "string",
};

const noticeTemplateOption: NoticeTemplateOptionDefinition = {
  name: "noticeTemplate",
  type: "string",
};

const dryRunOption: DryRunOptionDefinition = {
  name: "dryRun",
  type: "boolean",
  default: false,
};

const authenticationOption: AuthenticationOptionDefinition = {
  name: "authentication",
  type: "object",
};

export const ConfluenceSync: ConfluenceSyncConstructor = class ConfluenceSync
  implements ConfluenceSyncInterface
{
  private _confluencePageTransformer: ConfluencePageTransformerInterface;
  private _confluenceSyncPages: ConfluenceSyncPagesInterface;
  private _urlOption: UrlOption;
  private _personalAccessTokenOption: PersonalAccessTokenOption;
  private _spaceKeyOption: SpaceKeyOption;
  private _rootPageIdOption: RootPageIdOption;
  private _rootPageNameOption: RootPageNameOption;
  private _noticeMessageOption: NoticeMessageOption;
  private _noticeTemplateOption: NoticeTemplateOption;
  private _authenticationOption: AuthenticationOption;
  private _dryRunOption: DryRunOption;
  private _initialized = false;
  private _logger: LoggerInterface;
  private _modeOption: ModeOption;

  constructor({ config, logger, mode }: ConfluenceSyncOptions) {
    this._urlOption = config.addOption(urlOption) as UrlOption;
    this._personalAccessTokenOption = config.addOption(
      personalAccessTokenOption,
    ) as PersonalAccessTokenOption;
    this._spaceKeyOption = config.addOption(spaceKeyOption) as SpaceKeyOption;
    this._rootPageIdOption = config.addOption(
      rootPageIdOption,
    ) as RootPageIdOption;
    this._rootPageNameOption = config.addOption(
      rootPageNameOption,
    ) as RootPageNameOption;
    this._noticeMessageOption = config.addOption(
      noticeMessageOption,
    ) as NoticeMessageOption;
    this._noticeTemplateOption = config.addOption(
      noticeTemplateOption,
    ) as NoticeTemplateOption;
    this._authenticationOption = config.addOption(
      authenticationOption,
    ) as AuthenticationOption;
    this._dryRunOption = config.addOption(dryRunOption) as DryRunOption;
    this._modeOption = mode;
    this._logger = logger;
  }

  public async sync(confluencePages: ConfluenceSyncPage[]): Promise<void> {
    await this._init();
    this._logger.debug(`confluence.url option is ${this._urlOption.value}`);
    this._logger.debug(
      `confluence.spaceKey option is ${this._spaceKeyOption.value}`,
    );
    this._logger.debug(
      `confluence.dryRun option is ${this._dryRunOption.value}`,
    );
    this._logger.info(
      `Confluence pages to sync: ${confluencePages.map((page) => page.title).join(", ")}`,
    );
    this._logger.silly(
      `Extended version: ${JSON.stringify(confluencePages, null, 2)}`,
    );
    const pages =
      await this._confluencePageTransformer.transform(confluencePages);
    this._checkConfluencePagesIds(pages);
    this._logger.info(
      `Confluence pages to sync after transformation: ${pages
        .map((page) => page.title)
        .join(", ")}`,
    );
    this._logger.silly(`Extended version: ${JSON.stringify(pages, null, 2)}`);
    await this._confluenceSyncPages.sync(pages);
  }

  private _init() {
    if (!this._initialized) {
      if (!this._urlOption.value) {
        throw new Error(
          "Confluence URL is required. Please set confluence.url option.",
        );
      }
      if (!this._personalAccessTokenOption.value) {
        throw new Error(
          "Confluence personal access token is required. Please set confluence.personalAccessToken option.",
        );
      }
      if (!this._spaceKeyOption.value) {
        throw new Error(
          "Confluence space id is required. Please set confluence.spaceId option.",
        );
      }
      if (
        !this._rootPageIdOption.value &&
        this._modeOption.value === SyncModes.TREE
      ) {
        throw new Error(
          "Confluence root page id is required for TREE sync mode. Please set confluence.rootPageId option.",
        );
      }

      this._confluencePageTransformer = new ConfluencePageTransformer({
        noticeMessage: this._noticeMessageOption.value,
        noticeTemplate: this._noticeTemplateOption.value,
        rootPageName: this._rootPageNameOption.value,
        spaceKey: this._spaceKeyOption.value,
        logger: this._logger.namespace("transformer"),
      });

      this._confluenceSyncPages = new ConfluenceSyncPages({
        url: this._urlOption.value,
        personalAccessToken: this._personalAccessTokenOption.value,
        authentication: this._authenticationOption.value,
        spaceId: this._spaceKeyOption.value,
        rootPageId: this._rootPageIdOption.value,
        logLevel: this._logger.level,
        dryRun: this._dryRunOption.value,
        syncMode: this._modeOption.value as SyncModes,
      });
      this._initialized = true;
    }
  }

  private _checkConfluencePagesIds(pages: ConfluenceInputPage[]) {
    if (
      !this._rootPageIdOption.value &&
      this._modeOption.value === SyncModes.FLAT
    ) {
      const allPagesHaveId = pages.every(({ id }) =>
        isStringWithLength(id as string),
      );
      if (!allPagesHaveId) {
        throw new PageIdRequiredException();
      }
    }
  }
};
