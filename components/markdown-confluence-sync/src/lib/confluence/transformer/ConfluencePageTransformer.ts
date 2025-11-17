// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { dirname, resolve } from "node:path";

import type { LoggerInterface } from "@mocks-server/logger";
import type { ConfluenceInputPage } from "@telefonica/confluence-sync";
import type { TemplateDelegate } from "handlebars";
import Handlebars from "handlebars";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { toVFile } from "to-vfile";

import type { ConfluenceSyncPage } from "../ConfluenceSync.types.js";

import type {
  ConfluencePageTransformerConstructor,
  ConfluencePageTransformerInterface,
  ConfluencePageTransformerOptions,
  ConfluencePageTransformerTemplateData,
} from "./ConfluencePageTransformer.types.js";
import { InvalidTemplateError } from "./errors/InvalidTemplateError.js";
import rehypeAddAttachmentsImages from "./support/rehype/rehype-add-attachments-images.js";
import type { ImagesMetadata } from "./support/rehype/rehype-add-attachments-images.types.js";
import rehypeAddNotice from "./support/rehype/rehype-add-notice.js";
import rehypeReplaceCodeBlocks from "./support/rehype/rehype-replace-code-blocks.js";
import rehypeReplaceDetails from "./support/rehype/rehype-replace-details.js";
import rehypeReplaceImgTags from "./support/rehype/rehype-replace-img-tags.js";
import rehypeReplaceInternalReferences from "./support/rehype/rehype-replace-internal-references.js";
import rehypeReplaceStrikethrough from "./support/rehype/rehype-replace-strikethrough.js";
import rehypeReplaceTaskList from "./support/rehype/rehype-replace-task-list.js";
import remarkRemoveFootnotes from "./support/remark/remark-remove-footnotes.js";
import remarkRemoveMdxCodeBlocks from "./support/remark/remark-remove-mdx-code-blocks.js";
import remarkReplaceMermaid from "./support/remark/remark-replace-mermaid.js";

const DEFAULT_NOTICE_MESSAGE =
  "AUTOMATION NOTICE: This page is synced automatically, changes made manually will be lost";

const DEFAULT_MERMAID_DIAGRAMS_LOCATION = "mermaid-diagrams";

export const ConfluencePageTransformer: ConfluencePageTransformerConstructor = class ConfluenceTransformer
  implements ConfluencePageTransformerInterface
{
  private readonly _noticeMessage?: string;
  private readonly _noticeTemplateRaw?: string;
  private readonly _noticeTemplate?: TemplateDelegate<ConfluencePageTransformerTemplateData>;
  private readonly _rootPageName?: string;
  private readonly _spaceKey: string;
  private readonly _logger?: LoggerInterface;
  private readonly _rehypeCodeBlocksEnabled: boolean;

  constructor({
    noticeMessage,
    noticeTemplate,
    rootPageName,
    spaceKey,
    logger,
    codeBlocks,
  }: ConfluencePageTransformerOptions) {
    this._noticeMessage = noticeMessage;
    this._noticeTemplateRaw = noticeTemplate;
    this._noticeTemplate = noticeTemplate
      ? Handlebars.compile(noticeTemplate, { noEscape: true })
      : undefined;
    this._rootPageName = rootPageName;
    this._spaceKey = spaceKey;
    this._logger = logger;
    this._rehypeCodeBlocksEnabled = codeBlocks ?? false;
  }

  public async transform(
    _pages: ConfluenceSyncPage[],
  ): Promise<ConfluenceInputPage[]> {
    const pages = this._transformPageTitles(_pages);
    const pagesMap = new Map(pages.map((page) => [page.path, page]));
    return Promise.all(
      pages.map((page) => this._transformPage(page, pagesMap)),
    );
  }

  private async _transformPageContent(
    page: ConfluenceSyncPage,
    pages: Map<string, ConfluenceSyncPage>,
  ): Promise<ConfluenceInputPage> {
    const noticeMessage: string = this._composeNoticeMessage(page);
    const mermaidDiagramsDir = resolve(
      dirname(page.path),
      DEFAULT_MERMAID_DIAGRAMS_LOCATION,
    );
    try {
      let processor = remark()
        .use(remarkGfm)
        .use(remarkFrontmatter)
        .use(remarkRemoveFootnotes)
        .use(remarkRemoveMdxCodeBlocks)
        .use(remarkReplaceMermaid, {
          outDir: mermaidDiagramsDir,
        })
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeAddNotice, { noticeMessage })
        .use(rehypeReplaceDetails)
        .use(rehypeReplaceStrikethrough)
        .use(rehypeReplaceTaskList);

      // Conditionally add code blocks plugin
      if (this._rehypeCodeBlocksEnabled) {
        processor = processor.use(rehypeReplaceCodeBlocks);
      }

      const content = processor
        .use(rehypeAddAttachmentsImages)
        .use(rehypeReplaceImgTags)
        .use(rehypeReplaceInternalReferences, {
          spaceKey: this._spaceKey,
          pages,
          removeMissing: true,
        })
        .use(rehypeStringify, {
          allowDangerousHtml: true,
          closeSelfClosing: true,
          tightSelfClosing: true,
        })
        .processSync(toVFile({ value: page.content, path: page.path }));
      if (content.messages.length > 0)
        this._logger?.silly(
          `Transformed page content: ${JSON.stringify(content.messages, null, 2)}`,
        );
      return {
        id: page.id,
        title: page.title,
        content: content.toString(),
        attachments: content.data.images as ImagesMetadata,
        ancestors: page.ancestors,
      };
    } catch (e) {
      this._logger?.error(
        `Error occurs while transforming page content ${page.path}: ${e}`,
      );
      throw e;
    }
  }

  private _composeNoticeMessage(page: ConfluenceSyncPage): string {
    let noticeMessage: string | undefined;
    try {
      noticeMessage = this._noticeTemplate
        ? this._noticeTemplate({
            relativePath: page.relativePath,
            relativePathWithoutExtension: page.relativePath
              .split(".")
              .slice(0, -1)
              .join("."),
            title: page.title,
            message: this._noticeMessage ?? "",
            default: DEFAULT_NOTICE_MESSAGE,
          })
        : undefined;
    } catch (e) {
      const error = new InvalidTemplateError(
        `Invalid notice template: ${this._noticeTemplateRaw}`,
        { cause: e },
      );
      this._logger?.error(`Error occurs while rendering template: ${error}`);
      throw error;
    }
    if (typeof noticeMessage === "string") {
      return noticeMessage;
    }
    return this._noticeMessage ?? DEFAULT_NOTICE_MESSAGE;
  }

  private async _transformPage(
    page: ConfluenceSyncPage,
    pages: Map<string, ConfluenceSyncPage>,
  ): Promise<ConfluenceInputPage> {
    const confluenceInputPage = await this._transformPageContent(page, pages);
    this._logger?.silly(
      `Transformed page: ${JSON.stringify(confluenceInputPage, null, 2)}`,
    );
    return confluenceInputPage;
  }

  private _transformPageTitles(
    pages: ConfluenceSyncPage[],
  ): ConfluenceSyncPage[] {
    const pagesMap = new Map(pages.map((page) => [page.path, page]));
    const rootPageAncestor =
      this._rootPageName !== undefined ? [this._rootPageName] : [];
    const pageTitleLookupTable = new Map(
      pages.map((page) => {
        const ancestors = this._resolveAncestorsTitles(page, pagesMap);
        const ancestorsTitle = rootPageAncestor
          .concat(ancestors)
          .map((ancestor) => `[${ancestor}]`)
          .join("");
        const title =
          ancestorsTitle !== ""
            ? `${ancestorsTitle} ${page.title}`
            : page.title;
        return [page.path, title];
      }),
    );
    this._logger?.debug(
      `pageTitleLookupTable: ${JSON.stringify(Object.fromEntries(pageTitleLookupTable), null, 2)}`,
    );
    return pages.map((page) => ({
      ...page,
      title: pageTitleLookupTable.get(page.path) as string,
      ancestors: page.ancestors.map(
        (ancestor) => pageTitleLookupTable.get(ancestor) as string,
      ),
    }));
  }

  private _resolveAncestorsTitles(
    page: ConfluenceSyncPage,
    pages: Map<string, ConfluenceSyncPage>,
  ): string[] {
    return page.ancestors.map((ancestor) => {
      const ancestorPage = pages.get(ancestor);
      // NOTE: Coverage ignored because it is unreachable from tests. Defensive programming.
      // istanbul ignore next
      if (!ancestorPage) {
        throw new Error(`Ancestor page not found: ${ancestor}`);
      }
      return ancestorPage.name ?? ancestorPage.title;
    });
  }
};
