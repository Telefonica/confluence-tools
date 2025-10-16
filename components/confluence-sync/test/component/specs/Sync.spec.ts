/*eslint-disable jest/max-expects */
// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { ConfluenceSyncPagesInterface } from "@src/index";
import { ConfluenceSyncPages, SyncModes } from "@src/index";

import type { SpyRequest } from "../../../mocks/support/SpyStorage.types";
import {
  createWrongPages,
  deleteWrongPages,
  flatPages,
  flatPagesWithRoot,
  pagesNoRoot,
  pagesWithRoot,
  renamedPage,
  updateWrongPages,
  wrongPages,
} from "../support/fixtures/Pages";
import {
  changeMockCollection,
  getRequests,
  getRequestsByRouteId,
  resetRequests,
} from "../support/mock/Client";

describe("confluence-sync-pages library", () => {
  describe("sync method", () => {
    let createRequests: SpyRequest[];
    let updateRequests: SpyRequest[];
    let deleteRequests: SpyRequest[];
    let getAttachmentsRequests: SpyRequest[];
    let createAttachmentsRequests: SpyRequest[];
    let confluenceSyncPages: ConfluenceSyncPagesInterface;

    function findRequestByTitle(title: string, collection: SpyRequest[]) {
      return collection.find((request) => request?.body?.title === title);
    }

    function findRequestById(id: string, collection: SpyRequest[]) {
      return collection.find((request) => request?.params?.pageId === id);
    }

    beforeAll(async () => {
      confluenceSyncPages = new ConfluenceSyncPages({
        personalAccessToken: "foo-token",
        spaceId: "foo-space-id",
        rootPageId: "foo-root-id",
        url: "http://127.0.0.1:3100",
        logLevel: "debug",
      });
    });

    afterEach(async () => {
      await resetRequests();
    });

    describe("when the root page has no children (pagesNoRoot input and empty-root mock)", () => {
      beforeAll(async () => {
        await changeMockCollection("empty-root");
        await confluenceSyncPages.sync(pagesNoRoot);
        createRequests = await getRequestsByRouteId("confluence-create-page");
      });

      it("should have created 7 pages", async () => {
        expect(createRequests).toHaveLength(7);
      });

      it("should have sent data of page with title foo-parent-title", async () => {
        const pageRequest = findRequestByTitle(
          "foo-parent-title",
          createRequests,
        );

        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "foo-parent-title",
          space: {
            key: "foo-space-id",
          },
          ancestors: [
            {
              id: "foo-root-id",
            },
          ],
          body: {
            storage: {
              value: "foo-parent-content",
              representation: "storage",
            },
          },
        });
      });

      it("should have sent data of page with title foo-child1-title", async () => {
        const pageRequest = findRequestByTitle(
          "foo-child1-title",
          createRequests,
        );

        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "foo-child1-title",
          space: {
            key: "foo-space-id",
          },
          ancestors: [
            {
              id: "foo-parent-id",
            },
          ],
          body: {
            storage: {
              value: "foo-child1-content",
              representation: "storage",
            },
          },
        });
      });

      it("should have sent data of page with title foo-child2-title", async () => {
        const pageRequest = findRequestByTitle(
          "foo-child2-title",
          createRequests,
        );

        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "foo-child2-title",
          space: {
            key: "foo-space-id",
          },
          ancestors: [
            {
              id: "foo-parent-id",
            },
          ],
          body: {
            storage: {
              value: "foo-child2-content",
              representation: "storage",
            },
          },
        });
      });

      it("should have sent data of page with title foo-grandChild1-title", async () => {
        const pageRequest = findRequestByTitle(
          "foo-grandChild1-title",
          createRequests,
        );

        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "foo-grandChild1-title",
          space: {
            key: "foo-space-id",
          },
          ancestors: [
            {
              id: "foo-child1-id",
            },
          ],
          body: {
            storage: {
              value: "foo-grandChild1-content",
              representation: "storage",
            },
          },
        });
      });

      it("should have sent data of page with title foo-grandChild3-title", async () => {
        const pageRequest = findRequestByTitle(
          "foo-grandChild3-title",
          createRequests,
        );

        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "foo-grandChild3-title",
          space: {
            key: "foo-space-id",
          },
          ancestors: [
            {
              id: "foo-child2-id",
            },
          ],
          body: {
            storage: {
              value: "foo-grandChild3-content",
              representation: "storage",
            },
          },
        });
      });
    });

    describe("when the root page has children (default-root mock)", () => {
      beforeAll(async () => {
        await changeMockCollection("default-root");
      });

      describe("when input is pageWithRoot", () => {
        beforeAll(async () => {
          await confluenceSyncPages.sync(pagesWithRoot);

          createRequests = await getRequestsByRouteId("confluence-create-page");
          updateRequests = await getRequestsByRouteId("confluence-update-page");
          deleteRequests = await getRequestsByRouteId("confluence-delete-page");
          getAttachmentsRequests = await getRequestsByRouteId(
            "confluence-get-attachments",
          );
          createAttachmentsRequests = await getRequestsByRouteId(
            "confluence-create-attachments",
          );
        });

        it("should have created 3 pages", async () => {
          expect(createRequests).toHaveLength(3);
        });

        it("should have create page with title foo-child2-title", async () => {
          const pageRequest = findRequestByTitle(
            "foo-child2-title",
            createRequests,
          );

          expect(pageRequest?.url).toBe("/rest/api/content");
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "foo-child2-title",
            space: {
              key: "foo-space-id",
            },
            ancestors: [
              {
                id: "foo-parent-id",
              },
            ],
            body: {
              storage: {
                value: "foo-child2-content",
                representation: "storage",
              },
            },
          });
        });

        it("should have updated 3 page", async () => {
          expect(updateRequests).toHaveLength(3);
        });

        it("should have update page with title foo-parent-title", async () => {
          const pageRequest = findRequestByTitle(
            "foo-parent-title",
            updateRequests,
          );

          expect(pageRequest?.url).toBe("/rest/api/content/foo-parent-id");
          expect(pageRequest?.method).toBe("PUT");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "foo-parent-title",
            version: {
              number: 2,
            },
            ancestors: [
              {
                id: "foo-root-id",
              },
            ],
            body: {
              storage: {
                value: "foo-parent-content",
                representation: "storage",
              },
            },
          });
        });

        it("should have deleted 1 page and 1 attachment", async () => {
          expect(deleteRequests).toHaveLength(2);
        });

        it("should have delete page with title foo-grandChild2-title", async () => {
          const pageRequest = findRequestById(
            "foo-grandChild2-id",
            deleteRequests,
          );

          expect(pageRequest?.url).toBe("/rest/api/content/foo-grandChild2-id");
          expect(pageRequest?.method).toBe("DELETE");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({});
        });

        it("should have delete attachment with title foo-grandChild1-attachment-title", async () => {
          const pageRequest = findRequestById(
            "foo-grandChild1-attachment-id",
            deleteRequests,
          );

          expect(pageRequest?.url).toBe(
            "/rest/api/content/foo-grandChild1-attachment-id",
          );
          expect(pageRequest?.method).toBe("DELETE");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({});
        });

        it("should have get attachments of 3 pages", async () => {
          expect(getAttachmentsRequests).toHaveLength(3);
        });

        it("should have create attachment for page foo-grandChild3", async () => {
          const pageRequest = findRequestById(
            "foo-grandChild3-id",
            createAttachmentsRequests,
          );

          expect(pageRequest?.url).toBe(
            "/rest/api/content/foo-grandChild3-id/child/attachment",
          );
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.headers["x-atlassian-token"]).toBe("no-check");
          expect(pageRequest?.headers["content-type"]).toContain(
            "multipart/form-data",
          );
        });
      });

      describe("when input tree is wrong", () => {
        let error: string;

        beforeAll(async () => {
          try {
            await confluenceSyncPages.sync(wrongPages);
          } catch (e) {
            error = (e as Error).message;
          }

          createRequests = await getRequestsByRouteId("confluence-create-page");
          updateRequests = await getRequestsByRouteId("confluence-update-page");
          deleteRequests = await getRequestsByRouteId("confluence-delete-page");
        });

        it("should throw an error", async () => {
          expect(error).toBe(
            `There still are 1 pages to create after sync: foo-wrongPage-title, check if they have their ancestors created.`,
          );
        });

        it("should have created 0 pages", async () => {
          expect(createRequests).toHaveLength(0);
        });

        it("should have updated 2 page", async () => {
          expect(updateRequests).toHaveLength(2);
        });

        it("should have deleted 2 pages", async () => {
          expect(deleteRequests).toHaveLength(2);
        });
      });

      describe("when a request fails", () => {
        let error: string;

        describe("when a create request fails", () => {
          beforeAll(async () => {
            try {
              await confluenceSyncPages.sync(createWrongPages);
            } catch (e) {
              error = (e as Error).message;
            }

            createRequests = await getRequestsByRouteId(
              "confluence-create-page",
            );
            updateRequests = await getRequestsByRouteId(
              "confluence-update-page",
            );
            deleteRequests = await getRequestsByRouteId(
              "confluence-delete-page",
            );
          });

          it("should throw an error", async () => {
            expect(error).toBe(
              `Error creating page with title foo-wrongPage-title: Unknown Error`,
            );
          });

          it("should have created 2 pages and tried with the failed one", async () => {
            expect(createRequests).toHaveLength(3);
          });

          it("should have updated 2 page", async () => {
            expect(updateRequests).toHaveLength(2);
          });

          it("should have deleted 2 pages", async () => {
            expect(deleteRequests).toHaveLength(2);
          });
        });

        describe("when an update request fails", () => {
          beforeAll(async () => {
            try {
              await confluenceSyncPages.sync(updateWrongPages);
            } catch (e) {
              error = (e as Error).message;
            }

            createRequests = await getRequestsByRouteId(
              "confluence-create-page",
            );
            updateRequests = await getRequestsByRouteId(
              "confluence-update-page",
            );
            deleteRequests = await getRequestsByRouteId(
              "confluence-delete-page",
            );
          });

          it("should throw an error", async () => {
            expect(error).toBe(
              `Error updating page with id foo-grandChild2-id and title foo-grandChild2-title: Unknown Error`,
            );
          });

          it("should have created 2 pages", async () => {
            expect(createRequests).toHaveLength(2);
          });

          it("should have updated 2 pages and tried with the failed one", async () => {
            expect(updateRequests).toHaveLength(3);
          });

          it("should have deleted 1 pages", async () => {
            expect(deleteRequests).toHaveLength(1);
          });
        });

        describe("when a delete request fails", () => {
          beforeAll(async () => {
            try {
              await confluenceSyncPages.sync(deleteWrongPages);
            } catch (e) {
              error = (e as Error).message;
            }

            createRequests = await getRequestsByRouteId(
              "confluence-create-page",
            );
            updateRequests = await getRequestsByRouteId(
              "confluence-update-page",
            );
            deleteRequests = await getRequestsByRouteId(
              "confluence-delete-page",
            );
          });

          it("should throw an error", async () => {
            expect(error).toBe(
              `Error deleting content with id foo-child1-id: Unknown Error`,
            );
          });

          it("should have created 2 pages", async () => {
            expect(createRequests).toHaveLength(2);
          });

          it("should have updated 1 page", async () => {
            expect(updateRequests).toHaveLength(1);
          });

          it("should have deleted 2 pages and tried with the failed one", async () => {
            expect(deleteRequests).toHaveLength(3);
          });
        });
      });

      describe("when a page has been renamed", () => {
        let requests: SpyRequest[];
        let getPageRequests: SpyRequest[];
        let getPageChildrenRequests: SpyRequest[];

        beforeAll(async () => {
          await changeMockCollection("renamed-page");
          await confluenceSyncPages.sync(renamedPage);

          requests = await getRequests();
          getPageRequests = await getRequestsByRouteId("confluence-get-page");
          getPageChildrenRequests = await getRequestsByRouteId(
            "confluence-get-page-children",
          );
          createRequests = await getRequestsByRouteId("confluence-create-page");
          deleteRequests = await getRequestsByRouteId("confluence-delete-page");
        });

        it("should execute delete requests before create requests", async () => {
          // Request to get the root page children
          expect(requests[0].routeId).toBe("confluence-get-page-children");
          expect(getPageChildrenRequests[0].params?.pageId).toBe("foo-root-id");
          // Request to get the root page
          expect(requests[1].routeId).toBe("confluence-get-page");
          expect(getPageRequests[0].params?.pageId).toBe("foo-root-id");

          // Request to get the root page children
          expect(requests[2].routeId).toBe("confluence-get-page-children");
          expect(getPageChildrenRequests[1].params?.pageId).toBe(
            "foo-parent-id",
          );
          // Request to get the parent page, child of the root page
          expect(requests[3].routeId).toBe("confluence-get-page");
          expect(getPageRequests[1].params?.pageId).toBe("foo-parent-id");

          // Request to delete the parent page
          expect(requests[4].routeId).toBe("confluence-delete-page");
          expect(deleteRequests[0].params?.pageId).toBe("foo-parent-id");
          // Request to create the renamed page because is child of the root page
          expect(requests[5].routeId).toBe("confluence-create-page");
          expect(createRequests[0].body?.title).toBe("foo-renamed-title");

          // Request to get the child1 page which is child of the parent page
          expect(requests[6].routeId).toBe("confluence-get-page-children");
          expect(getPageChildrenRequests[2].params?.pageId).toBe(
            "foo-child1-id",
          );
          // Request to get the child1 page which is child of the parent page
          expect(requests[7].routeId).toBe("confluence-get-page");
          expect(getPageRequests[2].params?.pageId).toBe("foo-child1-id");

          // Request to delete the child1 page
          expect(requests[8].routeId).toBe("confluence-delete-page");
          expect(deleteRequests[1].params?.pageId).toBe("foo-child1-id");
          // Request to create the child1 page because is child of the renamed page
          expect(requests[9].routeId).toBe("confluence-create-page");
          expect(createRequests[1].body?.title).toBe("foo-child1-title");

          // Request to get the grandChild1 page which is child of the child1 page child of parent page
          expect(requests[10].routeId).toBe("confluence-get-page-children");
          expect(getPageChildrenRequests[3].params?.pageId).toBe(
            "foo-grandChild1-id",
          );
          // Request to get the grandChild1 page which is child of the child1 page child of parent page
          expect(requests[11].routeId).toBe("confluence-get-page");
          expect(getPageRequests[3].params?.pageId).toBe("foo-grandChild1-id");

          // Request to delete the grandChild1 page
          expect(requests[12].routeId).toBe("confluence-delete-page");
          expect(deleteRequests[2].params?.pageId).toBe("foo-grandChild1-id");

          // Request to get the grandChild2 page children because is child of the child1 page child of parent page
          expect(requests[13].routeId).toBe("confluence-get-page-children");
          expect(getPageChildrenRequests[4].params?.pageId).toBe(
            "foo-grandChild2-id",
          );
          // Request to get the grandChild2 page because is child of the child1 page child of parent page
          expect(requests[14].routeId).toBe("confluence-get-page");
          expect(getPageRequests[4].params?.pageId).toBe("foo-grandChild2-id");

          // Request to delete the grandChild2 page
          expect(requests[15].routeId).toBe("confluence-delete-page");
          expect(deleteRequests[3].params?.pageId).toBe("foo-grandChild2-id");
          // Request to create the grandChild1 page because is child of the child1 page child of the renamed page
          expect(requests[16].routeId).toBe("confluence-create-page");
          expect(createRequests[2].body?.title).toBe("foo-grandChild1-title");
          // Request to create the grandChild2 page because is child of the child1 page child of the renamed page
          expect(requests[17].routeId).toBe("confluence-create-page");
          expect(createRequests[3].body?.title).toBe("foo-grandChild2-title");
        });

        it("should create all the children pages of the renamed page", async () => {
          expect(createRequests).toHaveLength(4);
        });
      });
    });

    describe("when flat mode is enabled", () => {
      describe("when passing two pages with id", () => {
        beforeAll(async () => {
          confluenceSyncPages = new ConfluenceSyncPages({
            personalAccessToken: "foo-token",
            spaceId: "foo-space-id",
            syncMode: SyncModes.FLAT,
            url: "http://127.0.0.1:3100",
            logLevel: "debug",
            rootPageId: "foo-root-id",
          });

          await changeMockCollection("flat-mode");
          await confluenceSyncPages.sync(flatPages);
          updateRequests = await getRequestsByRouteId("confluence-update-page");
        });

        it("should have updated 2 pages", async () => {
          expect(updateRequests).toHaveLength(2);
        });

        it("should have updated page foo-page-1-title", async () => {
          const pageRequest = findRequestById("foo-page-1-id", updateRequests);

          expect(pageRequest?.url).toBe("/rest/api/content/foo-page-1-id");
          expect(pageRequest?.method).toBe("PUT");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "foo-page-1-title",
            version: {
              number: 2,
            },
            body: {
              storage: {
                value: "foo-page-1-content",
                representation: "storage",
              },
            },
          });
        });

        describe("when a page does not exist in confluence", () => {
          it("should throw an error", async () => {
            const wrongPage = {
              id: "foo-wrongPage-id",
              title: "foo-wrongPage-title",
              content: "foo-wrongPage-content",
            };

            await expect(
              confluenceSyncPages.sync([
                wrongPage,
                {
                  title: "foo-page-1-title",
                  content: "foo-page-1-content",
                },
              ]),
            ).rejects.toThrow(
              `Error getting page with id ${wrongPage.id}: Unknown Error`,
            );
          });
        });
      });

      describe("when passing one page with id", () => {
        beforeAll(async () => {
          confluenceSyncPages = new ConfluenceSyncPages({
            personalAccessToken: "foo-token",
            spaceId: "foo-space-id",
            syncMode: SyncModes.FLAT,
            url: "http://127.0.0.1:3100",
            logLevel: "debug",
            rootPageId: "foo-root-id",
          });

          await changeMockCollection("flat-mode");
          await confluenceSyncPages.sync(flatPagesWithRoot);
          createRequests = await getRequestsByRouteId("confluence-create-page");
          updateRequests = await getRequestsByRouteId("confluence-update-page");
          deleteRequests = await getRequestsByRouteId("confluence-delete-page");
        });

        it("should have created 1 page", async () => {
          expect(createRequests).toHaveLength(1);
        });

        it("should have updated 1 page", async () => {
          expect(updateRequests).toHaveLength(1);
        });

        it("should have deleted 1 page", async () => {
          expect(deleteRequests).toHaveLength(1);
        });

        it("should have created page foo-page-3-title", async () => {
          const pageRequest = findRequestByTitle(
            "foo-page-3-title",
            createRequests,
          );

          expect(pageRequest?.url).toBe("/rest/api/content");
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "foo-page-3-title",
            space: {
              key: "foo-space-id",
            },
            ancestors: [
              {
                id: "foo-root-id",
              },
            ],
            body: {
              storage: {
                value: "foo-page-3-content",
                representation: "storage",
              },
            },
          });
        });

        it("should have updated page foo-page-1-title", async () => {
          const pageRequest = findRequestById("foo-page-1-id", updateRequests);

          expect(pageRequest?.url).toBe("/rest/api/content/foo-page-1-id");
          expect(pageRequest?.method).toBe("PUT");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "foo-page-1-title",
            version: {
              number: 2,
            },
            body: {
              storage: {
                value: "foo-page-1-content",
                representation: "storage",
              },
            },
          });
        });

        it("should have deleted page foo-page-2-title", async () => {
          const pageRequest = findRequestById("foo-page-2-id", deleteRequests);

          expect(pageRequest?.url).toBe("/rest/api/content/foo-page-2-id");
          expect(pageRequest?.method).toBe("DELETE");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        });
      });
    });
  });
});
