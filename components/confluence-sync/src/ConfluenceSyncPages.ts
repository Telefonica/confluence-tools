// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "node:fs/promises";

import type { LoggerInterface } from "@mocks-server/logger";
import { Logger } from "@mocks-server/logger";
import type { queueAsPromised } from "fastq";
import { promise } from "fastq";

import { CustomConfluenceClient } from "./confluence/CustomConfluenceClient";
import type {
  ConfluenceInputPage,
  ConfluenceSyncPagesConfig,
  ConfluenceSyncPagesConstructor,
  ConfluenceSyncPagesCreateAttachmentsTask,
  ConfluenceSyncPagesCreateTask,
  ConfluenceSyncPagesDeleteAttachmentsTask,
  ConfluenceSyncPagesDeleteTask,
  ConfluenceSyncPagesInitSyncTask,
  ConfluenceSyncPagesInterface,
  ConfluenceSyncPagesJob,
  ConfluenceSyncPagesTask,
  ConfluenceSyncPagesUpdateTask,
} from "./ConfluenceSyncPages.types";
import { SyncModes } from "./ConfluenceSyncPages.types";
import { CompoundError } from "./errors/CompoundError";
import { NotAncestorsExpectedValidationError } from "./errors/NotAncestorsExpectedValidationError";
import { PendingPagesToSyncError } from "./errors/PendingPagesToSyncError";
import { RootPageRequiredException } from "./errors/RootPageRequiredException";
import { ShouldUseIdModeException } from "./errors/ShouldUseIdModeException";
import { RootPageForbiddenException } from "./errors/RootPageForbiddenException";
import { PagesWithoutIdException } from "./errors/PagesWithoutIdException";
import { InvalidSyncModeException } from "./errors/InvalidSyncModeException";
import { getPagesTitles } from "./support/Pages";
import type {
  ConfluenceClientInterface,
  ConfluencePage,
  ConfluencePageBasicInfo,
} from "./types";

const LOGGER_NAMESPACE = "confluence-sync-pages";
const DEFAULT_LOG_LEVEL = "silent";

export const ConfluenceSyncPages: ConfluenceSyncPagesConstructor = class ConfluenceSyncPages
  implements ConfluenceSyncPagesInterface
{
  private _logger: LoggerInterface;
  private _confluenceClient: ConfluenceClientInterface;
  private _rootPageId: string | undefined;
  private _syncMode: SyncModes;

  constructor({
    logLevel,
    url,
    spaceId,
    personalAccessToken,
    authentication,
    dryRun,
    syncMode,
    rootPageId,
  }: ConfluenceSyncPagesConfig) {
    this._logger = new Logger(LOGGER_NAMESPACE, {
      level: logLevel ?? DEFAULT_LOG_LEVEL,
    });
    this._confluenceClient = new CustomConfluenceClient({
      url,
      spaceId,
      personalAccessToken,
      authentication,
      logger: this._logger.namespace("confluence"),
      dryRun,
    });
    this._syncMode = syncMode ?? SyncModes.TREE;

    if (
      ![SyncModes.FLAT, SyncModes.ID, SyncModes.TREE].includes(this._syncMode)
    ) {
      throw new InvalidSyncModeException(this._syncMode);
    }

    if (this._syncMode === SyncModes.TREE && rootPageId === undefined) {
      throw new RootPageRequiredException(SyncModes.TREE);
    }
    this._rootPageId = rootPageId;
  }

  public get logger(): LoggerInterface {
    return this._logger;
  }

  public async sync(pages: ConfluenceInputPage[]): Promise<void> {
    const syncMode = this._syncMode;
    const confluencePages = new Map<string, ConfluencePage>();
    const pagesMap = new Map(pages.map((page) => [page.title, page]));
    const tasksDone = new Array<ConfluenceSyncPagesTask>();
    const errors = new Array<Error>();
    const queue: queueAsPromised<ConfluenceSyncPagesJob> = promise(
      this._handleTask.bind(this),
      1,
    );
    function enqueueTask(task: ConfluenceSyncPagesTask) {
      queue.push({
        task,
        enqueueTask,
        getConfluencePageByTitle,
        getPageByTitle,
        getPagesByAncestor,
        storeConfluencePage,
      });
    }
    function getConfluencePageByTitle(pageTitle: string) {
      return confluencePages.get(pageTitle);
    }
    function storeConfluencePage(page: ConfluencePage) {
      confluencePages.set(page.title, page);
    }
    function getPageByTitle(pageTitle: string) {
      return pagesMap.get(pageTitle);
    }
    function getPagesByAncestor(ancestor: string, isRoot = false) {
      if (syncMode === SyncModes.FLAT) {
        // NOTE: in flat mode all pages without id are considered
        //  children of root page. Otherwise, they are pages with mirror
        //  page in Confluence and have no ancestors.
        if (isRoot) {
          return pages.filter((page) => page.id === undefined);
        }
        return [];
      }
      if (isRoot) {
        return pages
          .filter(
            (page) =>
              page.ancestors === undefined || page.ancestors.length === 0,
          )
          .concat(pages.filter((page) => page.ancestors?.at(-1) === ancestor));
      }
      return pages.filter((page) => page.ancestors?.at(-1) === ancestor);
    }

    queue.error((e, job) => {
      if (e) {
        errors.push(e);
        return;
      }
      const task = job.task;
      tasksDone.push(task);
    });

    if (this._syncMode === SyncModes.FLAT) {
      this._validateFlatMode(pages);
      pages
        .filter((page) => page.id !== undefined)
        .forEach((page) => {
          enqueueTask({ type: "update", pageId: page.id as string, page });
        });
    }

    if (this._syncMode === SyncModes.ID) {
      this._validateIdMode(pages);
      pages.forEach((page) => {
        enqueueTask({ type: "update", pageId: page.id as string, page });
      });
    }

    if (this._rootPageId !== undefined)
      enqueueTask({ type: "init", pageId: this._rootPageId });

    await queue.drained();

    if (errors.length > 0) {
      const e = new CompoundError(...errors);
      this._logger.error(`Error occurs during sync: ${e}`);
      throw e;
    }
    this._assertPendingPagesToCreate(tasksDone, pages);
    this._reportTasks(tasksDone);
  }

  private _validateIdMode(pages: ConfluenceInputPage[]): void {
    const pagesWithoutId = pages.filter((page) => page.id === undefined);
    if (pagesWithoutId.length > 0) {
      throw new PagesWithoutIdException(pagesWithoutId);
    }
    if (this._rootPageId !== undefined) {
      throw new RootPageForbiddenException();
    }
    const pagesWithAncestors = pages.filter(
      (page) => page.ancestors !== undefined && page.ancestors.length > 0,
    );
    if (pagesWithAncestors.length > 0) {
      throw new NotAncestorsExpectedValidationError(pagesWithAncestors);
    }
  }

  private _validateFlatMode(pages: ConfluenceInputPage[]): void {
    const pagesWithoutId = pages.filter((page) => page.id === undefined);
    if (pagesWithoutId.length === 0) {
      throw new ShouldUseIdModeException(
        `There are no pages without id. You should use ID mode instead of FLAT mode`,
      );
    }
    if (this._rootPageId === undefined) {
      throw new RootPageRequiredException(SyncModes.FLAT);
    }
    const pagesWithAncestors = pages.filter(
      (page) => page.ancestors !== undefined && page.ancestors.length > 0,
    );
    if (pagesWithAncestors.length > 0) {
      throw new NotAncestorsExpectedValidationError(pagesWithAncestors);
    }
  }

  private _assertPendingPagesToCreate(
    tasksDone: ConfluenceSyncPagesTask[],
    _pages: ConfluenceInputPage[],
  ) {
    const createdOrUpdatedPages = tasksDone
      .filter<
        ConfluenceSyncPagesCreateTask | ConfluenceSyncPagesUpdateTask
      >((task): task is ConfluenceSyncPagesCreateTask | ConfluenceSyncPagesUpdateTask => task.type === "create" || task.type === "update")
      .map((task) => task.page.title);
    const pendingPagesToCreate = _pages.filter(
      (page) => !createdOrUpdatedPages.includes(page.title),
    );
    if (pendingPagesToCreate.length > 0) {
      const e = new PendingPagesToSyncError(pendingPagesToCreate);
      this._logger.error(e.message);
      throw e;
    }
  }

  private _reportTasks(tasks: ConfluenceSyncPagesTask[]): void {
    const createdPages = tasks.filter<ConfluenceSyncPagesCreateTask>(
      (task): task is ConfluenceSyncPagesCreateTask => task.type === "create",
    );
    this._logger.debug(`Created pages: ${createdPages.length}
    ${createdPages.map((task) => `+ ${task.page.title}`).join("\n")}`);
    const updatedPages = tasks.filter<ConfluenceSyncPagesUpdateTask>(
      (task): task is ConfluenceSyncPagesUpdateTask => task.type === "update",
    );
    this._logger.debug(`Updated pages: ${updatedPages.length}
      ${updatedPages.map((task) => `⟳ #${task.pageId} ${task.page.title}`).join("\n")}`);
    const deletedPages = tasks.filter<ConfluenceSyncPagesDeleteTask>(
      (task): task is ConfluenceSyncPagesDeleteTask => task.type === "delete",
    );
    this._logger.debug(`Deleted pages: ${deletedPages.length}
      ${deletedPages.map((task) => `- #${task.pageId}`).join("\n")}`);
    this._logger.info("Sync finished");
  }

  private _handleTask(job: ConfluenceSyncPagesJob): Promise<void> {
    const task = job.task;
    switch (task.type) {
      case "init":
        return this._initSync({ ...job, task });
      case "create":
        return this._createPage({ ...job, task });
      case "update":
        return this._updatePage({ ...job, task });
      case "delete":
        return this._deletePage({ ...job, task });
      case "createAttachments":
        return this._createAttachments({ ...job, task });
      case "deleteAttachments":
        return this._deleteAttachments({ ...job, task });
    }
  }

  private async _initSync(
    job: ConfluenceSyncPagesJob<ConfluenceSyncPagesInitSyncTask>,
  ): Promise<void> {
    this._logger.debug(`Reading page ${job.task.pageId}`);
    const confluencePage = await this._confluenceClient.getPage(
      job.task.pageId,
    );
    job.storeConfluencePage(confluencePage);
    this._enqueueChildrenPages(job, confluencePage, true);
  }

  private async _createPage(
    job: ConfluenceSyncPagesJob<ConfluenceSyncPagesCreateTask>,
  ): Promise<void> {
    this._logger.debug(`Creating page ${JSON.stringify(job.task.page)}`);
    const ancestors: ConfluencePageBasicInfo[] | undefined =
      job.task.page.ancestors?.map((ancestorTitle) => {
        const ancestor = job.getConfluencePageByTitle(ancestorTitle);
        // NOTE: This should never happen. Defensively check anyway.
        // istanbul ignore next
        if (ancestor === undefined) {
          throw new Error(`Could not find ancestor ${ancestorTitle}`);
        }
        return { id: ancestor.id, title: ancestor.title };
      });
    const confluencePage = await this._confluenceClient.createPage({
      ...job.task.page,
      ancestors,
    });
    job.storeConfluencePage(confluencePage);
    if (
      job.task.page.attachments !== undefined &&
      Object.entries(job.task.page.attachments).length > 0
    )
      job.enqueueTask({
        type: "createAttachments",
        pageId: confluencePage.id,
        pageTitle: confluencePage.title,
        attachments: job.task.page.attachments,
      });
    const descendants = job.getPagesByAncestor(job.task.page.title);
    for (const descendant of descendants) {
      job.enqueueTask({ type: "create", page: descendant });
    }
  }

  private async _updatePage(
    job: ConfluenceSyncPagesJob<ConfluenceSyncPagesUpdateTask>,
  ): Promise<void> {
    this._logger.debug(`Updating page ${job.task.page.title}`);
    const confluencePage = await this._confluenceClient.getPage(
      job.task.pageId,
    );
    const updatedConfluencePage = await this._confluenceClient.updatePage({
      id: confluencePage.id,
      title: job.task.page.title,
      content: job.task.page.content,
      ancestors: confluencePage.ancestors,
      version: confluencePage.version + 1,
    });
    job.storeConfluencePage(updatedConfluencePage);
    const attachments = await this._confluenceClient.getAttachments(
      confluencePage.id,
    );
    for (const attachment of attachments) {
      this._logger.debug(
        `Enqueueing delete attachment ${attachment.title} for page ${confluencePage.title}`,
      );
      job.enqueueTask({ type: "deleteAttachments", pageId: attachment.id });
    }
    if (
      job.task.page.attachments !== undefined &&
      Object.entries(job.task.page.attachments).length > 0
    ) {
      job.enqueueTask({
        type: "createAttachments",
        pageId: confluencePage.id,
        pageTitle: confluencePage.title,
        attachments: job.task.page.attachments,
      });
    }
    if (this._syncMode === SyncModes.TREE) {
      this._enqueueChildrenPages(job, confluencePage);
    }
  }
  private async _deletePage(
    job: ConfluenceSyncPagesJob<ConfluenceSyncPagesDeleteTask>,
  ): Promise<void> {
    this._logger.debug(`Deleting page ${job.task.pageId}`);
    const confluencePage = await this._confluenceClient.getPage(
      job.task.pageId,
    );
    for (const descendant of confluencePage.children ?? []) {
      job.enqueueTask({ type: "delete", pageId: descendant.id });
    }
    await this._confluenceClient.deleteContent(job.task.pageId);
  }

  private async _deleteAttachments(
    job: ConfluenceSyncPagesJob<ConfluenceSyncPagesDeleteAttachmentsTask>,
  ): Promise<void> {
    this._logger.debug(`Deleting attachment ${job.task.pageId}`);
    await this._confluenceClient.deleteContent(job.task.pageId);
  }

  private async _createAttachments(
    job: ConfluenceSyncPagesJob<ConfluenceSyncPagesCreateAttachmentsTask>,
  ): Promise<void> {
    this._logger.debug(
      `Creating attachments for page ${job.task.pageTitle}, attachments: ${JSON.stringify(
        job.task.attachments,
      )}`,
    );
    const attachments = await Promise.all(
      Object.entries(job.task.attachments).map(async ([name, path]) => ({
        filename: name,
        file: await readFile(path),
      })),
    );
    await this._confluenceClient.createAttachments(
      job.task.pageId,
      attachments,
    );
  }

  private _enqueueChildrenPages(
    job: ConfluenceSyncPagesJob,
    confluencePage: ConfluencePage,
    isRoot = false,
  ) {
    const descendants = job.getPagesByAncestor(confluencePage.title, isRoot);
    const confluenceDescendants = confluencePage.children ?? [];
    let descendantsWithPageId: string[] = [];
    if (isRoot) {
      descendants.forEach((descendant) => {
        descendant.ancestors = [confluencePage.title];
      });
      if (this._syncMode === SyncModes.FLAT) {
        const confluenceDescendantsInputPages = confluenceDescendants
          .map(({ title }) => job.getPageByTitle(title))
          .filter(Boolean) as ConfluenceInputPage[];
        descendantsWithPageId = getPagesTitles(
          confluenceDescendantsInputPages.filter(
            (page) => page.id !== undefined,
          ),
        );
        if (descendantsWithPageId.length)
          this._logger.warn(
            `Some children of root page contains id: ${descendantsWithPageId.join(", ")}`,
          );
      }
    }
    const descendantsToCreate = descendants.filter(
      (descendant) =>
        !confluenceDescendants.some(
          (other) => other.title === descendant.title,
        ),
    );
    const descendantsToUpdate = confluenceDescendants
      .filter((descendant) =>
        descendants.some((other) => other.title === descendant.title),
      )
      .map((descendant) => {
        const page = job.getPageByTitle(
          descendant.title,
        ) as ConfluenceInputPage;
        return { pageId: descendant.id, page };
      });
    const descendantsToDelete = confluenceDescendants.filter(
      (descendant) =>
        !descendants.some((other) => other.title === descendant.title) &&
        !descendantsWithPageId.includes(descendant.title),
    );
    for (const descendant of descendantsToDelete) {
      job.enqueueTask({ type: "delete", pageId: descendant.id });
    }
    for (const descendant of descendantsToCreate) {
      job.enqueueTask({ type: "create", page: descendant });
    }
    for (const descendant of descendantsToUpdate) {
      job.enqueueTask({
        type: "update",
        pageId: descendant.pageId,
        page: descendant.page,
      });
    }
  }
};
