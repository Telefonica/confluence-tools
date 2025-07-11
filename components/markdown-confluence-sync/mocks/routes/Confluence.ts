// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type {
  NextFunction,
  RouteDefinition,
  ScopedCoreInterface,
  Request as ServerRequest,
  Response as ServerResponse,
} from "@mocks-server/core";

import {
  ATTACHMENTS_DEFAULT_ROOT,
  PAGES_DEFAULT_ROOT_CREATE,
  PAGES_DEFAULT_ROOT_DELETE,
  PAGES_DEFAULT_ROOT_GET,
  PAGES_DEFAULT_ROOT_UPDATE,
  PAGES_EMPTY_ROOT,
  PAGES_WITH_CONFLUENCE_PAGE_ID,
  PAGES_WITH_CONFLUENCE_PAGE_ID_ATTACHMENTS,
  PAGES_WITH_CONFLUENCE_TITLE,
  PAGES_WITH_MDX_FILES,
  PAGES_WITH_ROOT_PAGE_NAME,
  PAGES_WITH_ALTERNATIVE_INDEX_FILES,
} from "../support/fixtures/ConfluencePages";
import { addRequest } from "../support/SpyStorage";

function getPageMiddleware(pages) {
  return (
    req: ServerRequest,
    res: ServerResponse,
    _next: NextFunction,
    core: ScopedCoreInterface,
  ) => {
    core.logger.info(
      `Requested page with id ${req.params.pageId} to Confluence`,
    );

    addRequest("confluence-get-page", req);
    const page = pages.find(
      (pageCandidate) => pageCandidate.id === req.params.pageId,
    );
    if (page) {
      const pageData = {
        id: page.id,
        title: page.title,
        content: "",
        version: { number: 1 },
        ancestors: page.ancestors,
      };
      core.logger.info(`Sending page ${JSON.stringify(pageData)}`);
      res.status(200).json(pageData);
    } else {
      core.logger.error(
        `Page with id ${req.params.pageId} not found in Confluence`,
      );
      res.status(404).send();
    }
  };
}

function getPageChildrenMiddleware(pages) {
  return (
    req: ServerRequest,
    res: ServerResponse,
    _next: NextFunction,
    core: ScopedCoreInterface,
  ) => {
    core.logger.info(
      `Requested page children with id ${req.params.pageId} to Confluence`,
    );

    addRequest("confluence-get-page-children", req);
    const page = pages.find(
      (pageCandidate) => pageCandidate.id === req.params.pageId,
    );
    if (page) {
      const pageData = page.children;
      core.logger.info(`Sending page ${JSON.stringify(pageData)}`);
      res.status(200).json(pageData);
    } else {
      core.logger.error(
        `Page with id ${req.params.pageId} not found in Confluence`,
      );
      res.status(404).send();
    }
  };
}

function createPageMiddleware(pages) {
  return (
    req: ServerRequest,
    res: ServerResponse,
    _next: NextFunction,
    core: ScopedCoreInterface,
  ) => {
    core.logger.info(
      `Creating page in Confluence: ${JSON.stringify(req.body)}`,
    );

    addRequest("confluence-create-page", req);

    const page = pages.find(
      (pageCandidate) => pageCandidate.title === req.body.title,
    );
    if (page) {
      res.status(200).json({
        title: req.body.title,
        id: page.id,
        version: { number: 1 },
        ancestors: page.ancestors,
      });
    } else {
      core.logger.error(
        `Bad request creating page in Confluence: ${JSON.stringify(req.body)}`,
      );
      core.logger.error(`Available pages: ${JSON.stringify(pages)}`);
      res.status(400).send();
    }
  };
}

function updatePageMiddleware(pages) {
  return (
    req: ServerRequest,
    res: ServerResponse,
    _next: NextFunction,
    core: ScopedCoreInterface,
  ) => {
    core.logger.info(
      `Updating page in Confluence: ${JSON.stringify(req.body)}`,
    );

    addRequest("confluence-update-page", req);

    const page = pages.find(
      (pageCandidate) => pageCandidate.id === req.params.pageId,
    );
    if (page) {
      res.status(200).json({
        title: req.body.title,
        id: page.id,
        version: { number: 1 },
        ancestors: page.ancestors,
      });
    } else {
      core.logger.error(
        `Bad request creating page in Confluence: ${JSON.stringify(req.body)}`,
      );
      core.logger.error(`Available pages: ${JSON.stringify(pages)}`);
      res.status(400).send();
    }
  };
}

function deletePageMiddleware(pages) {
  return (
    req: ServerRequest,
    res: ServerResponse,
    _next: NextFunction,
    core: ScopedCoreInterface,
  ) => {
    core.logger.info(
      `Deleting page in Confluence: ${JSON.stringify(req.params.pageId)}`,
    );

    addRequest("confluence-delete-page", req);

    const page = pages.find(
      (pageCandidate) => pageCandidate.id === req.params.pageId,
    );
    if (page) {
      res.status(204).send();
    } else {
      core.logger.error(
        `Page with id ${req.params.pageId} not found in Confluence`,
      );
      res.status(404).send();
    }
  };
}

function getAttachmentsMiddleware(attachments) {
  return (
    req: ServerRequest,
    res: ServerResponse,
    _next: NextFunction,
    core: ScopedCoreInterface,
  ) => {
    core.logger.info(
      `Requested attachments for page with id ${req.params.pageId} to Confluence`,
    );

    addRequest("confluence-get-attachments", req);
    const pageAttachments = attachments.find(
      (attachment) => attachment.id === req.params.pageId,
    );
    if (pageAttachments) {
      core.logger.info(
        `Sending attachments ${JSON.stringify(pageAttachments)}`,
      );
      res.status(200).json(pageAttachments.attachments);
    } else {
      core.logger.error(
        `Attachments for page with id ${req.params.pageId} not found in Confluence`,
      );
      res.status(404).send();
    }
  };
}

function createAttachmentsMiddleware(attachments) {
  return (
    req: ServerRequest,
    res: ServerResponse,
    _next: NextFunction,
    core: ScopedCoreInterface,
  ) => {
    core.logger.info(
      `Creating attachments for page with id ${req.params.pageId} in Confluence: ${JSON.stringify(
        req.body,
      )}`,
    );

    addRequest("confluence-create-attachments", req);

    const attachmentsResponse = attachments.find(
      (attachment) => attachment.id === req.params.pageId,
    );
    if (attachmentsResponse) {
      res.status(200).send();
    } else {
      core.logger.error(
        `Bad request creating attachments for page with id ${
          req.params.pageId
        } in Confluence: ${JSON.stringify(req.body)}`,
      );
      core.logger.error(
        `Available attachments: ${JSON.stringify(attachments)}`,
      );
      res.status(400).send();
    }
  };
}

const confluenceRoutes: RouteDefinition[] = [
  {
    id: "confluence-get-page",
    url: "/rest/api/content/:pageId",
    method: "GET",
    variants: [
      {
        id: "empty-root",
        type: "middleware",
        options: {
          middleware: getPageMiddleware(PAGES_EMPTY_ROOT),
        },
      },
      {
        id: "default-root",
        type: "middleware",
        options: {
          middleware: getPageMiddleware(PAGES_DEFAULT_ROOT_GET),
        },
      },
      {
        id: "with-root-page-name",
        type: "middleware",
        options: {
          middleware: getPageMiddleware(PAGES_WITH_ROOT_PAGE_NAME),
        },
      },
      {
        id: "with-mdx-files",
        type: "middleware",
        options: {
          middleware: getPageMiddleware(PAGES_WITH_MDX_FILES),
        },
      },
      {
        id: "with-confluence-title",
        type: "middleware",
        options: {
          middleware: getPageMiddleware(PAGES_WITH_CONFLUENCE_TITLE),
        },
      },
      {
        id: "with-alternative-index-files",
        type: "middleware",
        options: {
          middleware: getPageMiddleware(PAGES_WITH_ALTERNATIVE_INDEX_FILES),
        },
      },
      {
        id: "with-confluence-page-id",
        type: "middleware",
        options: {
          middleware: getPageMiddleware(PAGES_WITH_CONFLUENCE_PAGE_ID),
        },
      },
    ],
  },
  {
    id: "confluence-get-page-children",
    url: "/rest/api/content/:pageId/child",
    method: "GET",
    variants: [
      {
        id: "empty-root",
        type: "middleware",
        options: {
          middleware: getPageChildrenMiddleware(PAGES_EMPTY_ROOT),
        },
      },
      {
        id: "default-root",
        type: "middleware",
        options: {
          middleware: getPageChildrenMiddleware(PAGES_DEFAULT_ROOT_GET),
        },
      },
      {
        id: "with-root-page-name",
        type: "middleware",
        options: {
          middleware: getPageChildrenMiddleware(PAGES_WITH_ROOT_PAGE_NAME),
        },
      },
      {
        id: "with-mdx-files",
        type: "middleware",
        options: {
          middleware: getPageChildrenMiddleware(PAGES_WITH_MDX_FILES),
        },
      },
      {
        id: "with-confluence-title",
        type: "middleware",
        options: {
          middleware: getPageChildrenMiddleware(PAGES_WITH_CONFLUENCE_TITLE),
        },
      },
      {
        id: "with-alternative-index-files",
        type: "middleware",
        options: {
          middleware: getPageChildrenMiddleware(
            PAGES_WITH_ALTERNATIVE_INDEX_FILES,
          ),
        },
      },
      {
        id: "with-confluence-page-id",
        type: "middleware",
        options: {
          middleware: getPageChildrenMiddleware(PAGES_WITH_CONFLUENCE_PAGE_ID),
        },
      },
    ],
  },
  {
    id: "confluence-create-page",
    url: "/rest/api/content",
    method: "POST",
    variants: [
      {
        id: "empty-root",
        type: "middleware",
        options: {
          middleware: createPageMiddleware(PAGES_EMPTY_ROOT),
        },
      },
      {
        id: "default-root",
        type: "middleware",
        options: {
          middleware: createPageMiddleware(PAGES_DEFAULT_ROOT_CREATE),
        },
      },
      {
        id: "with-root-page-name",
        type: "middleware",
        options: {
          middleware: createPageMiddleware(PAGES_WITH_ROOT_PAGE_NAME),
        },
      },
      {
        id: "with-mdx-files",
        type: "middleware",
        options: {
          middleware: createPageMiddleware(PAGES_WITH_MDX_FILES),
        },
      },
      {
        id: "with-confluence-title",
        type: "middleware",
        options: {
          middleware: createPageMiddleware(PAGES_WITH_CONFLUENCE_TITLE),
        },
      },
      {
        id: "with-alternative-index-files",
        type: "middleware",
        options: {
          middleware: createPageMiddleware(PAGES_WITH_ALTERNATIVE_INDEX_FILES),
        },
      },
      {
        id: "with-confluence-page-id",
        type: "middleware",
        options: {
          middleware: createPageMiddleware(PAGES_WITH_CONFLUENCE_PAGE_ID),
        },
      },
    ],
  },
  {
    id: "confluence-update-page",
    url: "/rest/api/content/:pageId",
    method: "PUT",
    variants: [
      {
        id: "default-root",
        type: "middleware",
        options: {
          middleware: updatePageMiddleware(PAGES_DEFAULT_ROOT_UPDATE),
        },
      },
      {
        id: "with-confluence-page-id",
        type: "middleware",
        options: {
          middleware: updatePageMiddleware(PAGES_WITH_CONFLUENCE_PAGE_ID),
        },
      },
    ],
  },
  {
    id: "confluence-delete-page",
    url: "/rest/api/content/:pageId",
    method: "DELETE",
    variants: [
      {
        id: "default-root",
        type: "middleware",
        options: {
          middleware: deletePageMiddleware(PAGES_DEFAULT_ROOT_DELETE),
        },
      },
    ],
  },
  {
    id: "confluence-get-attachments",
    url: "/rest/api/content/:pageId/child/attachment",
    method: "GET",
    variants: [
      {
        id: "default-root",
        type: "middleware",
        options: {
          middleware: getAttachmentsMiddleware(ATTACHMENTS_DEFAULT_ROOT),
        },
      },
      {
        id: "with-confluence-page-id",
        type: "middleware",
        options: {
          middleware: getAttachmentsMiddleware(
            PAGES_WITH_CONFLUENCE_PAGE_ID_ATTACHMENTS,
          ),
        },
      },
    ],
  },
  {
    id: "confluence-create-attachments",
    url: "/rest/api/content/:pageId/child/attachment",
    method: "POST",
    variants: [
      {
        id: "default-root",
        type: "middleware",
        options: {
          middleware: createAttachmentsMiddleware(ATTACHMENTS_DEFAULT_ROOT),
        },
      },
      {
        id: "empty-root",
        type: "middleware",
        options: {
          middleware: createAttachmentsMiddleware(ATTACHMENTS_DEFAULT_ROOT),
        },
      },
    ],
  },
];

export default confluenceRoutes;
