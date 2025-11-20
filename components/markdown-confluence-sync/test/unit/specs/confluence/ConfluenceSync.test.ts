// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type {
  ConfigInterface,
  ConfigNamespaceInterface,
} from "@mocks-server/config";
import { Config } from "@mocks-server/config";
import type { LoggerInterface } from "@mocks-server/logger";
import { Logger } from "@mocks-server/logger";
import type { DirResult } from "tmp";

import { customConfluencePage } from "@support/mocks/ConfluencePageTransformer";
import { customConfluenceSyncPages } from "@support/mocks/ConfluenceSyncPages";
import { TempFiles } from "@support/utils/TempFiles";
const { dirSync } = new TempFiles();

import type { ConfluenceSyncOptions, ModeOption } from "@src/lib";
import { ConfluenceSync } from "@src/lib/confluence/ConfluenceSync";

const CONFIG = {
  config: {
    readArguments: false,
    readFile: false,
    readEnvironment: false,
  },
};

describe("confluenceSync", () => {
  let dir: DirResult;
  let config: ConfigInterface;
  let namespace: ConfigNamespaceInterface;
  let logger: LoggerInterface;
  let confluenceSyncOptions: ConfluenceSyncOptions;

  beforeEach(async () => {
    dir = dirSync({ unsafeCleanup: true });
    config = new Config({
      moduleName: "markdown-confluence-sync",
    });
    config.addOption({
      name: "mode",
      type: "string",
      default: "tree",
    });
    namespace = config.addNamespace("confluence");
    logger = new Logger("");
    logger.setLevel("silent", { transport: "console" });
    confluenceSyncOptions = {
      config: namespace,
      logger,
      mode: config.option("mode") as ModeOption,
      rehypeConfig: config.addNamespace("rehype"),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    dir.removeCallback();
  });

  it("should be defined", () => {
    expect(ConfluenceSync).toBeDefined();
  });

  it("should log the pages to sync", async () => {
    // Arrange
    const confluenceSync = new ConfluenceSync(confluenceSyncOptions);
    const loggerSpy = jest.spyOn(logger, "info");
    await config.load({
      ...CONFIG,
      confluence: {
        url: "foo",
        personalAccessToken: "bar",
        spaceKey: "baz",
        rootPageId: "foo-root-id",
      },
    });
    customConfluencePage.transform.mockResolvedValue([
      { title: "foo-after-transformation-title" },
    ]);

    // Act
    await confluenceSync.sync([
      { ancestors: [], title: "foo-title", path: "foo", relativePath: "foo" },
    ]);

    // Assert
    expect(loggerSpy.mock.calls[0]).toStrictEqual([
      "Confluence pages to sync: foo-title",
    ]);
    expect(loggerSpy.mock.calls[1]).toStrictEqual([
      "Confluence pages to sync after transformation: foo-after-transformation-title",
    ]);
  });

  describe("read", () => {
    it("should fail if the url option is not defined", async () => {
      // Arrange
      const confluenceSync = new ConfluenceSync(confluenceSyncOptions);
      await config.load({
        ...CONFIG,
        confluence: {},
      });

      // Act
      // Assert
      await expect(async () => await confluenceSync.sync([])).rejects.toThrow(
        "Confluence URL is required. Please set confluence.url option.",
      );
    });

    it("should fail if the spaceKey option is not defined", async () => {
      // Arrange
      const confluenceSync = new ConfluenceSync(confluenceSyncOptions);
      await config.load({
        ...CONFIG,
        confluence: {
          url: "foo",
          personalAccessToken: "bar",
        },
      });

      // Act
      // Assert
      await expect(async () => await confluenceSync.sync([])).rejects.toThrow(
        "Confluence space id is required. Please set confluence.spaceId option.",
      );
    });

    it("should fail if the rootPageId option is not defined", async () => {
      // Arrange
      const confluenceSync = new ConfluenceSync(confluenceSyncOptions);
      await config.load({
        ...CONFIG,
        confluence: {
          url: "foo",
          personalAccessToken: "bar",
          spaceKey: "baz",
        },
      });

      // Act
      // Assert
      await expect(async () => await confluenceSync.sync([])).rejects.toThrow(
        "Confluence root page id is required for TREE sync mode. Please set confluence.rootPageId option.",
      );
    });

    it("should send the appropriate pages tree to sync-to-confluence", async () => {
      // Arrange
      const transformReturnValue = [
        {
          id: "foo-id",
          content: "foo-content",
        },
      ];
      const confluenceSync = new ConfluenceSync(confluenceSyncOptions);
      await config.load({
        ...CONFIG,
        confluence: {
          url: "foo",
          personalAccessToken: "bar",
          spaceKey: "baz",
          rootPageId: "foo-root-id",
        },
      });

      customConfluencePage.transform.mockResolvedValue(transformReturnValue);

      // Act
      await confluenceSync.sync([]);

      // Assert
      expect(customConfluenceSyncPages.sync).toHaveBeenCalledWith(
        transformReturnValue,
      );
    });

    describe("pages transformation", () => {
      it("should send the appropriate pages tree to sync-to-confluence", async () => {
        // Arrange
        const transformReturnValue = [
          {
            id: "foo-id",
            content: "foo-content",
          },
        ];
        const confluenceSync = new ConfluenceSync(confluenceSyncOptions);
        await config.load({
          ...CONFIG,
          confluence: {
            url: "foo",
            personalAccessToken: "bar",
            spaceKey: "baz",
            rootPageId: "foo-root-id",
          },
        });

        customConfluencePage.transform.mockResolvedValue(transformReturnValue);

        // Act
        await confluenceSync.sync([]);

        // Assert
        expect(customConfluenceSyncPages.sync).toHaveBeenCalledWith(
          transformReturnValue,
        );
      });
    });

    it("when called twice, it should send to synchronize the pages to confluence twice", async () => {
      // Arrange
      const transformReturnValue = [
        {
          id: "foo-id",
          title: "foo",
          content: "foo-content",
          ancestors: [{ id: "foo-root-id", title: "foo-root-title" }],
        },
      ];
      const confluenceSync = new ConfluenceSync(confluenceSyncOptions);
      await config.load({
        ...CONFIG,
        confluence: {
          url: "foo",
          personalAccessToken: "bar",
          spaceKey: "baz",
          rootPageId: "foo-root-id",
        },
      });

      customConfluencePage.transform.mockResolvedValue(transformReturnValue);

      // Act
      await confluenceSync.sync([]);
      await confluenceSync.sync([]);

      // Assert
      expect(customConfluenceSyncPages.sync.mock.calls).toHaveLength(2);
    });

    it("when sync mode is flat and page haven't id, the function throw an error", async () => {
      // Arrange
      const transformReturnValue = [
        {
          title: "foo",
          content: "foo-content",
          ancestors: [],
        },
      ];
      const confluenceSync = new ConfluenceSync(confluenceSyncOptions);
      await config.load({
        ...CONFIG,
        mode: "flat",
        confluence: {
          url: "foo",
          personalAccessToken: "bar",
          spaceKey: "baz",
        },
      });

      customConfluencePage.transform.mockResolvedValue(transformReturnValue);

      // Act
      // Assert
      await expect(async () => await confluenceSync.sync([])).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            "when there are pages without an id",
          ),
        }),
      );
    });

    it("when sync mode is flat and page have id, the function not throw an error", async () => {
      // Arrange
      const transformReturnValue = [
        {
          id: "foo-id",
          title: "foo",
          content: "foo-content",
          ancestors: [],
        },
      ];
      const confluenceSync = new ConfluenceSync(confluenceSyncOptions);
      await config.load({
        ...CONFIG,
        mode: "flat",
        confluence: {
          url: "foo",
          personalAccessToken: "bar",
          spaceKey: "baz",
        },
      });

      customConfluencePage.transform.mockResolvedValue(transformReturnValue);

      // Act
      // Assert
      await expect(async () => await confluenceSync.sync([])).not.toThrow();
    });
  });
});
