// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { CollectionDefinition } from "@mocks-server/core";

const collection: CollectionDefinition[] = [
  {
    id: "base",
    routes: ["spy-get-requests:send", "spy-reset-requests:reset"],
  },
  {
    id: "empty-root",
    from: "base",
    routes: [
      "confluence-get-page:empty-root",
      "confluence-get-page-children:empty-root",
      "confluence-create-page:empty-root",
      "confluence-create-attachments:empty-root",
      // "confluence-update-page:success",
      // "confluence-delete-page:success",
    ],
  },
  {
    id: "default-root",
    from: "base",
    routes: [
      "confluence-get-page:default-root",
      "confluence-get-page-children:default-root",
      "confluence-create-page:default-root",
      "confluence-update-page:default-root",
      "confluence-delete-page:default-root",
      "confluence-get-attachments:default-root",
      "confluence-create-attachments:default-root",
    ],
  },
  {
    id: "with-root-page-name",
    from: "base",
    routes: [
      "confluence-get-page:with-root-page-name",
      "confluence-get-page-children:with-root-page-name",
      "confluence-create-page:with-root-page-name",
    ],
  },
  {
    id: "with-mdx-files",
    from: "base",
    routes: [
      "confluence-get-page:with-mdx-files",
      "confluence-get-page-children:with-mdx-files",
      "confluence-create-page:with-mdx-files",
    ],
  },
  {
    id: "with-confluence-title",
    from: "base",
    routes: [
      "confluence-get-page:with-confluence-title",
      "confluence-get-page-children:with-confluence-title",
      "confluence-create-page:with-confluence-title",
    ],
  },
  {
    id: "with-alternative-index-files",
    from: "base",
    routes: [
      "confluence-get-page:with-alternative-index-files",
      "confluence-get-page-children:with-alternative-index-files",
      "confluence-create-page:with-alternative-index-files",
    ],
  },
  {
    id: "with-confluence-page-id",
    from: "base",
    routes: [
      "confluence-get-page:with-confluence-page-id",
      "confluence-get-page-children:with-confluence-page-id",
      "confluence-create-page:with-confluence-page-id",
      "confluence-update-page:with-confluence-page-id",
      "confluence-get-attachments:with-confluence-page-id",
    ],
  },
];

export default collection;
