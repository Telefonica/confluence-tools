// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { customConfluenceSync } from "@support/mocks/ConfluenceSync";
import { customDocusaurusPages } from "@support/mocks/DocusaurusPages";

import { MarkdownConfluenceSync } from "@src/lib";

const CONFIG = {
  config: {
    readArguments: false,
    readFile: false,
    readEnvironment: false,
  },
};

describe("markdownConfluenceSync", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(MarkdownConfluenceSync).toBeDefined();
  });

  it("should fail if not pass the configuration", async () => {
    // Assert
    //@ts-expect-error Ignore the next line to don't pass configuration
    expect(() => new MarkdownConfluenceSync()).toThrow(
      "Please provide configuration",
    );
  });

  it("should not call to synchronize if dryRun is true", async () => {
    // Arrange
    const markdownConfluenceSync = new MarkdownConfluenceSync({
      ...CONFIG,
      dryRun: true,
    });

    // Act
    await markdownConfluenceSync.sync();

    // Assert
    expect(customConfluenceSync.sync).not.toHaveBeenCalled();
  });

  it("when called twice, it should send to synchronize the pages to confluence twice", async () => {
    // Arrange
    const markdownConfluenceSync = new MarkdownConfluenceSync(CONFIG);
    customDocusaurusPages.read.mockResolvedValue([]);

    // Act
    await markdownConfluenceSync.sync();
    await markdownConfluenceSync.sync();

    // Assert
    expect(customConfluenceSync.sync.mock.calls).toHaveLength(2);
  });
});
