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

export const ConfluenceClientConstructor = jest
  .spyOn(confluenceLibrary, "ConfluenceClient")
  // @ts-expect-error The mock has not all methods
  .mockImplementation(() => {
    return confluenceClient;
  });
