// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

jest.mock("confluence.js");

import * as confluenceLibrary from "confluence.js";

export const confluenceClient = {
  content: {
    getContentById: jest.fn().mockResolvedValue({}),
    createContent: jest.fn().mockResolvedValue({}),
    updateContent: jest.fn().mockResolvedValue({}),
    deleteContent: jest.fn().mockResolvedValue({}),
  },
  contentChildrenAndDescendants: {
    getContentChildren: jest.fn().mockResolvedValue({}),
  },
  contentAttachments: {
    getAttachments: jest.fn().mockResolvedValue({}),
    createAttachments: jest.fn().mockResolvedValue({}),
  },
};

/* ts ignore next line because it expects a mock with the same parameters as the confluence client
 * but there are a lot of them useless for the test */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-next-line
jest.spyOn(confluenceLibrary, "ConfluenceClient").mockImplementation(() => {
  return confluenceClient;
});
