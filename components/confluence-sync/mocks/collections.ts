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
    id: "hierarchical-empty-root",
    from: "base",
    routes: [
      "confluence-get-page:hierarchical-empty-root",
      "confluence-get-page-children:hierarchical-empty-root",
      "confluence-create-page:hierarchical-empty-root",
      // "confluence-update-page:hierarchical-empty-root",
      // "confluence-delete-page:hierarchical-empty-root",
    ],
  },
  {
    id: "hierarchical-default-root",
    from: "base",
    routes: [
      "confluence-get-page:hierarchical-default-root",
      "confluence-get-page-children:hierarchical-default-root",
      "confluence-create-page:hierarchical-default-root",
      "confluence-update-page:hierarchical-default-root",
      "confluence-delete-page:hierarchical-default-root",
    ],
  },
  {
    id: "flat-mode",
    from: "base",
    routes: [
      "confluence-get-page:flat-mode",
      "confluence-get-page-children:flat-mode",
      "confluence-create-page:flat-mode",
      "confluence-update-page:flat-mode",
      "confluence-delete-page:flat-mode",
      "confluence-get-attachments:flat-mode",
    ],
  },
  {
    id: "renamed-page",
    from: "base",
    routes: [
      "confluence-get-page:renamed-page",
      "confluence-get-page-children:renamed-page",
      "confluence-create-page:renamed-page",
      "confluence-delete-page:renamed-page",
      "confluence-get-attachments:renamed-page",
    ],
  },
];

export default collection;
