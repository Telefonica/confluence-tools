// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { LoggerInterface } from "@mocks-server/logger";
import { Logger } from "@mocks-server/logger";
import type { AxiosResponse } from "axios";
import { AxiosError } from "axios";
import type { Models } from "confluence.js";

import { cleanLogs } from "@support/Logs";
import { confluenceClient } from "@support/mocks/ConfluenceClient";

import { CustomConfluenceClient } from "@src/confluence/CustomConfluenceClient";
import type {
  Attachments,
  ConfluenceClientConfig,
  ConfluenceClientInterface,
  ConfluencePage,
} from "@src/index";

describe("customConfluenceClient class", () => {
  let logger: LoggerInterface;
  let config: ConfluenceClientConfig;
  let customConfluenceClient: ConfluenceClientInterface;
  let page: ConfluencePage;
  let defaultResponse: Models.Content;

  beforeEach(() => {
    logger = new Logger("", { level: "error" });
    logger.setLevel("silent", { transport: "console" });
    config = {
      spaceId: "foo-space-id",
      url: "foo-url",
      personalAccessToken: "foo-token",
      logger,
    };
    page = {
      title: "foo-title",
      id: "foo-id",
      content: "foo-content",
      version: 1,
      ancestors: [{ id: "foo-id-ancestor", title: "foo-ancestor" }],
    };
    customConfluenceClient = new CustomConfluenceClient(config);

    defaultResponse = {
      title: "foo-title",
      id: "foo-id",
      version: { number: 1 } as Models.Version,
      ancestors: [
        { id: "foo-id-ancestor", title: "foo-ancestor", type: "page" },
      ] as Models.Content[],
    } as Models.Content;
  });

  describe("getPage method", () => {
    it("should call confluence.js lib to get a page getting the body, ancestors, version and children, and passing the id", async () => {
      await customConfluenceClient.getPage("foo-id");

      expect(confluenceClient.content.getContentById).toHaveBeenCalledWith({
        id: "foo-id",
        expand: ["ancestors", "version.number", "children.page"],
      });
    });

    it("should return a page with the right properties", async () => {
      confluenceClient.content.getContentById.mockImplementation(() => ({
        title: "foo-title",
        id: "foo-id",
        version: { number: 1 },
        ancestors: [
          { id: "foo-id-ancestor", title: "foo-ancestor", type: "page" },
        ],
        children: {
          page: {
            results: [
              { id: "foo-child-1-id", title: "foo-child-1" },
              { id: "foo-child-2-id", title: "foo-child-2" },
            ],
          },
        },
      }));
      const response = await customConfluenceClient.getPage("foo-id");

      expect(response).toEqual({
        title: "foo-title",
        id: "foo-id",
        version: 1,
        ancestors: [{ id: "foo-id-ancestor", title: "foo-ancestor" }],
        children: [
          { id: "foo-child-1-id", title: "foo-child-1" },
          { id: "foo-child-2-id", title: "foo-child-2" },
        ],
      });
    });

    it("should throw an error if confluence.js lib throws an error", async () => {
      jest
        .spyOn(confluenceClient.content, "getContentById")
        .mockImplementation()
        .mockRejectedValueOnce("foo-error");

      await expect(customConfluenceClient.getPage("foo-id")).rejects.toThrow(
        "Error getting page with id foo-id: foo-error",
      );
    });
  });

  describe("createPage method", () => {
    it("should call confluence.js lib to create a page with right parameters", async () => {
      await customConfluenceClient.createPage(page);

      expect(confluenceClient.content.createContent).toHaveBeenCalledWith({
        type: "page",
        title: page.title,
        space: {
          key: config.spaceId,
        },
        ancestors: [{ id: page.ancestors?.at(-1)?.id }],
        body: {
          storage: {
            value: page.content,
            representation: "storage",
          },
        },
      });
    });

    it("should return the created page with the right properties", async () => {
      confluenceClient.content.createContent.mockImplementation(
        () => defaultResponse,
      );
      const response = await customConfluenceClient.createPage(page);

      expect(response).toEqual({
        ...defaultResponse,
        version: 1,
        ancestors: [{ id: "foo-id-ancestor", title: "foo-ancestor" }],
      });
    });

    describe("when the page has no ancestors", () => {
      it("should call confluence.js lib to create a page with right parameters but ancestor", async () => {
        await customConfluenceClient.createPage({
          ...page,
          ancestors: undefined,
        });

        expect(confluenceClient.content.createContent).toHaveBeenCalledWith({
          type: "page",
          title: page.title,
          space: {
            key: config.spaceId,
          },
          body: {
            storage: {
              value: page.content,
              representation: "storage",
            },
          },
        });
      });
    });

    describe("when the page has no content", () => {
      it("should call confluence.js lib to create a page with right parameters but content", async () => {
        await customConfluenceClient.createPage({
          ...page,
          content: undefined,
        });

        expect(confluenceClient.content.createContent).toHaveBeenCalledWith({
          type: "page",
          title: page.title,
          ancestors: [{ id: page.ancestors?.at(-1)?.id }],
          space: {
            key: config.spaceId,
          },
          body: {
            storage: {
              value: "",
              representation: "storage",
            },
          },
        });
      });
    });

    it("should throw an error if confluence.js lib throws an axios bad request error", async () => {
      jest
        .spyOn(confluenceClient.content, "createContent")
        .mockImplementation()
        .mockRejectedValueOnce(
          new AxiosError(undefined, undefined, undefined, undefined, {
            status: 400,
          } as AxiosResponse),
        );

      await expect(customConfluenceClient.createPage(page)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            "Error creating page with title foo-title: Error: Bad Request",
          ),
        }),
      );
    });

    it("should throw an error if confluence.js lib throws an axios unauthorized error", async () => {
      jest
        .spyOn(confluenceClient.content, "createContent")
        .mockImplementation()
        .mockRejectedValueOnce(
          new AxiosError(undefined, undefined, undefined, undefined, {
            status: 401,
          } as AxiosResponse),
        );

      await expect(customConfluenceClient.createPage(page)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            "Error creating page with title foo-title: Error: Unauthorized",
          ),
        }),
      );
    });

    it("should throw an error if confluence.js lib throws an axios forbidden error", async () => {
      jest
        .spyOn(confluenceClient.content, "createContent")
        .mockImplementation()
        .mockRejectedValueOnce(
          new AxiosError(undefined, undefined, undefined, undefined, {
            status: 403,
          } as AxiosResponse),
        );

      await expect(customConfluenceClient.createPage(page)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            "Error creating page with title foo-title: Error: Unauthorized",
          ),
        }),
      );
    });

    it("should throw an error if confluence.js lib throws an axios internal server error", async () => {
      jest
        .spyOn(confluenceClient.content, "createContent")
        .mockImplementation()
        .mockRejectedValueOnce(
          new AxiosError(undefined, undefined, undefined, undefined, {
            status: 500,
          } as AxiosResponse),
        );

      await expect(customConfluenceClient.createPage(page)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            "Error creating page with title foo-title: Error: Internal Server Error",
          ),
        }),
      );
    });

    it("should throw an error if confluence.js lib throws an axios any error", async () => {
      jest
        .spyOn(confluenceClient.content, "createContent")
        .mockImplementation()
        .mockRejectedValueOnce(new AxiosError());

      await expect(customConfluenceClient.createPage(page)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            "Error creating page with title foo-title: Error: Axios Error",
          ),
        }),
      );
    });

    it("should throw an error if confluence.js lib throws an error", async () => {
      jest
        .spyOn(confluenceClient.content, "createContent")
        .mockImplementation()
        .mockRejectedValueOnce("foo-error");

      await expect(customConfluenceClient.createPage(page)).rejects.toThrow(
        "Error creating page with title foo-title: Error: Unexpected Error: foo-error",
      );
    });
  });

  describe("updatePage method", () => {
    it("should call confluence.js lib to update a page with right parameters", async () => {
      await customConfluenceClient.updatePage(page);

      expect(confluenceClient.content.updateContent).toHaveBeenCalledWith({
        id: page.id,
        type: "page",
        title: page.title,
        ancestors: [{ id: page.ancestors?.at(-1)?.id }],
        version: {
          number: page.version,
        },
        body: {
          storage: {
            value: page.content,
            representation: "storage",
          },
        },
      });
    });

    it("should return the updated page with the right properties", async () => {
      confluenceClient.content.updateContent.mockImplementation(
        () => defaultResponse,
      );
      const response = await customConfluenceClient.updatePage(page);

      expect(response).toEqual({
        ...defaultResponse,
        version: 1,
        ancestors: [{ id: "foo-id-ancestor", title: "foo-ancestor" }],
      });
    });

    describe("when the page has no ancestors", () => {
      it("should call confluence.js lib to update a page with right parameters but ancestor", async () => {
        await customConfluenceClient.updatePage({
          ...page,
          ancestors: undefined,
        });

        expect(confluenceClient.content.updateContent).toHaveBeenCalledWith({
          id: page.id,
          type: "page",
          title: page.title,
          version: {
            number: page.version,
          },
          body: {
            storage: {
              value: page.content,
              representation: "storage",
            },
          },
        });
      });
    });

    describe("when the page has no content", () => {
      it("should call confluence.js lib to update a page with right parameters but content", async () => {
        await customConfluenceClient.updatePage({
          ...page,
          content: undefined,
        });

        expect(confluenceClient.content.updateContent).toHaveBeenCalledWith({
          id: page.id,
          type: "page",
          title: page.title,
          ancestors: [{ id: page.ancestors?.at(-1)?.id }],
          version: {
            number: page.version,
          },
          body: {
            storage: {
              value: "",
              representation: "storage",
            },
          },
        });
      });
    });

    it("should throw an error if confluence.js lib throws an axios bad request error", async () => {
      jest
        .spyOn(confluenceClient.content, "updateContent")
        .mockImplementation()
        .mockRejectedValueOnce(
          new AxiosError(undefined, undefined, undefined, undefined, {
            status: 400,
          } as AxiosResponse),
        );

      await expect(customConfluenceClient.updatePage(page)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            "Error updating page with id foo-id and title foo-title: Error: Bad Request",
          ),
        }),
      );
    });

    it("should throw an error if confluence.js lib throws an axios unauthorized error", async () => {
      jest
        .spyOn(confluenceClient.content, "updateContent")
        .mockImplementation()
        .mockRejectedValueOnce(
          new AxiosError(undefined, undefined, undefined, undefined, {
            status: 401,
          } as AxiosResponse),
        );

      await expect(customConfluenceClient.updatePage(page)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            "Error updating page with id foo-id and title foo-title: Error: Unauthorized",
          ),
        }),
      );
    });

    it("should throw an error if confluence.js lib throws an axios forbidden error", async () => {
      jest
        .spyOn(confluenceClient.content, "updateContent")
        .mockImplementation()
        .mockRejectedValueOnce(
          new AxiosError(undefined, undefined, undefined, undefined, {
            status: 403,
          } as AxiosResponse),
        );

      await expect(customConfluenceClient.updatePage(page)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            "Error updating page with id foo-id and title foo-title: Error: Unauthorized",
          ),
        }),
      );
    });

    it("should throw an error if confluence.js lib throws an axios internal server error", async () => {
      jest
        .spyOn(confluenceClient.content, "updateContent")
        .mockImplementation()
        .mockRejectedValueOnce(
          new AxiosError(undefined, undefined, undefined, undefined, {
            status: 500,
          } as AxiosResponse),
        );

      await expect(customConfluenceClient.updatePage(page)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            "Error updating page with id foo-id and title foo-title: Error: Internal Server Error",
          ),
        }),
      );
    });

    it("should throw an error if confluence.js lib throws an axios any error", async () => {
      jest
        .spyOn(confluenceClient.content, "updateContent")
        .mockImplementation()
        .mockRejectedValueOnce(new AxiosError());

      await expect(customConfluenceClient.updatePage(page)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            "Error updating page with id foo-id and title foo-title: Error: Axios Error",
          ),
        }),
      );
    });

    it("should throw an error if confluence.js lib throws an error", async () => {
      jest
        .spyOn(confluenceClient.content, "updateContent")
        .mockImplementation()
        .mockRejectedValueOnce("foo-error");

      await expect(customConfluenceClient.updatePage(page)).rejects.toThrow(
        "Error updating page with id foo-id and title foo-title: Error: Unexpected Error: foo-error",
      );
    });
  });

  describe("deleteContent method", () => {
    it("should call confluence.js lib to delete a content with the id passed", async () => {
      await customConfluenceClient.deleteContent(page.id);

      expect(confluenceClient.content.deleteContent).toHaveBeenCalledWith({
        id: page.id,
      });
    });

    it("should throw an error if confluence.js lib throws an error", async () => {
      jest
        .spyOn(confluenceClient.content, "deleteContent")
        .mockImplementation()
        .mockRejectedValueOnce("foo-error");

      await expect(
        customConfluenceClient.deleteContent(page.id),
      ).rejects.toThrow("Error deleting content with id foo-id: foo-error");
    });
  });

  describe("getAttachments method", () => {
    it("should call confluence.js lib to get attachments with the id passed", async () => {
      await customConfluenceClient.getAttachments(page.id);

      expect(
        confluenceClient.contentAttachments.getAttachments,
      ).toHaveBeenCalledWith({
        id: page.id,
      });
    });

    it("should return the attachments with the right properties", async () => {
      confluenceClient.contentAttachments.getAttachments.mockImplementation(
        () => ({
          results: [
            {
              id: "foo-id-attachment",
              title: "foo-attachment",
              _links: {
                download: "foo-download",
              },
            },
          ],
        }),
      );
      const response = await customConfluenceClient.getAttachments(page.id);

      expect(response).toEqual([
        {
          id: "foo-id-attachment",
          title: "foo-attachment",
        },
      ]);
    });

    it("should throw an error if confluence.js lib throws an error", async () => {
      confluenceClient.contentAttachments.getAttachments.mockRejectedValueOnce(
        "foo-error",
      );

      await expect(
        customConfluenceClient.getAttachments(page.id),
      ).rejects.toThrow(
        "Error getting attachments of page with id foo-id: foo-error",
      );
    });
  });

  describe("createAttachments method", () => {
    let attachments: Attachments;

    beforeAll(() => {
      attachments = [
        {
          filename: "foo-name",
          file: new ArrayBuffer(8) as Buffer,
        },
      ];
    });

    it("should call confluence.js lib to create the attachments of a page with the id passed", async () => {
      await customConfluenceClient.createAttachments(page.id, attachments);

      expect(
        confluenceClient.contentAttachments.createAttachments,
      ).toHaveBeenCalledWith({
        id: page.id,
        attachments: [
          {
            filename: "foo-name",
            minorEdit: true,
            file: new ArrayBuffer(8),
          },
        ],
      });
    });

    it("should throw an error if confluence.js lib throws an error", async () => {
      confluenceClient.contentAttachments.createAttachments.mockRejectedValueOnce(
        "foo-error",
      );

      await expect(
        customConfluenceClient.createAttachments(page.id, attachments),
      ).rejects.toThrow(
        "Error creating attachments of page with id foo-id: foo-error",
      );
    });
  });

  describe("when dryRun mode is enabled", () => {
    let customConfluenceClientDryRun: ConfluenceClientInterface;

    beforeEach(() => {
      customConfluenceClientDryRun = new CustomConfluenceClient({
        ...config,
        dryRun: true,
      });
    });

    describe("createPage method", () => {
      it("should not call confluence.js lib to create a page", async () => {
        await customConfluenceClientDryRun.createPage(page);

        expect(confluenceClient.content.createContent).not.toHaveBeenCalled();
      });

      it("should log the page that would have been created", async () => {
        logger.setLevel("info", { transport: "store" });

        await customConfluenceClientDryRun.createPage(page);

        expect(
          cleanLogs(customConfluenceClientDryRun.logger.globalStore),
        ).toContain(`Dry run: creating page with title ${page.title}`);
      });
    });

    describe("updatePage method", () => {
      it("should not call confluence.js lib to update a page", async () => {
        await customConfluenceClientDryRun.updatePage(page);

        expect(confluenceClient.content.updateContent).not.toHaveBeenCalled();
      });

      it("should log the page that would have been updated", async () => {
        logger.setLevel("info", { transport: "store" });

        await customConfluenceClientDryRun.updatePage(page);

        expect(
          cleanLogs(customConfluenceClientDryRun.logger.globalStore),
        ).toContain(`Dry run: updating page with title ${page.title}`);
      });
    });

    describe("deleteContent method", () => {
      it("should not call confluence.js lib to delete a page", async () => {
        await customConfluenceClientDryRun.deleteContent(page.id);

        expect(confluenceClient.content.deleteContent).not.toHaveBeenCalled();
      });

      it("should log the page that would have been deleted", async () => {
        logger.setLevel("info", { transport: "store" });

        await customConfluenceClientDryRun.deleteContent(page.id);

        expect(
          cleanLogs(customConfluenceClientDryRun.logger.globalStore),
        ).toContain(`Dry run: deleting content with id ${page.id}`);
      });
    });

    describe("createAttachments method", () => {
      let attachments: Attachments;

      beforeAll(() => {
        attachments = [
          {
            filename: "foo-name",
            file: new ArrayBuffer(8) as Buffer,
          },
        ];
      });

      it("should not call confluence.js lib to create the attachments of a page", async () => {
        await customConfluenceClientDryRun.createAttachments(
          page.id,
          attachments,
        );

        expect(
          confluenceClient.contentAttachments.createAttachments,
        ).not.toHaveBeenCalled();
      });

      it("should log the attachments that would have been created", async () => {
        logger.setLevel("info", { transport: "store" });

        await customConfluenceClientDryRun.createAttachments(
          page.id,
          attachments,
        );

        expect(
          cleanLogs(customConfluenceClientDryRun.logger.globalStore),
        ).toContain(
          `Dry run: creating attachments of page with id ${page.id}, attachments: ${attachments
            .map((attachment) => attachment.filename)
            .join(", ")}`,
        );
      });
    });
  });
});
