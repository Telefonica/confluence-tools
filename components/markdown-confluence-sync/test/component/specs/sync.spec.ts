// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { rm } from "fs/promises";
import { resolve } from "path";

import type { ChildProcessManagerInterface } from "@telefonica/child-process-manager";
import { ChildProcessManager } from "@telefonica/child-process-manager";
import { glob } from "glob";
import { dedent } from "ts-dedent";

import { cleanLogs } from "../support/Logs";
import {
  changeMockCollection,
  getRequestsByRouteId,
  resetRequests,
} from "../support/Mock";
import type { SpyRequest } from "../support/Mock.types";
import {
  getBinaryPathFromFixtureFolder,
  getFixtureFolder,
} from "../support/Paths";

describe("markdown-confluence-sync binary", () => {
  describe("when executed", () => {
    let createRequests: SpyRequest[];
    let updateRequests: SpyRequest[];
    let deleteRequests: SpyRequest[];
    let createAttachmentsRequests: SpyRequest[];
    let cli: ChildProcessManagerInterface;
    let exitCode: number | null;
    let logs: string[];

    function findRequestByTitle(title: string, collection: SpyRequest[]) {
      return collection.find((request) => request?.body?.title === title);
    }

    function findRequestById(id: string, collection: SpyRequest[]) {
      return collection.find((request) => request?.params?.pageId === id);
    }

    describe("when the root page has no children (pagesNoRoot input and empty-root mock)", () => {
      beforeAll(async () => {
        await changeMockCollection("empty-root");
        await resetRequests();

        cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
          cwd: getFixtureFolder("mock-server-empty-root"),
          silent: false,
          env: {
            MARKDOWN_CONFLUENCE_SYNC_LOG_LEVEL: "debug",
          },
        });

        const result = await cli.run();
        exitCode = result.exitCode;
        logs = result.logs;

        createRequests = await getRequestsByRouteId("confluence-create-page");
      });

      afterAll(async () => {
        await cli.kill();
      });

      describe("when creating pages", () => {
        it("should have exit code 0", async () => {
          expect(exitCode).toBe(0);
        });

        it("should have logged pages to sync", async () => {
          expect(cleanLogs(logs)).toContain(
            `Converting 19 markdown documents to Confluence pages...`,
          );
        });

        it("should have debug log level", async () => {
          expect(cleanLogs(logs)).toContain(
            `Found 19 pages in ${resolve(getFixtureFolder("mock-server-empty-root"), "docs")}`,
          );
        });

        it("should have created 19 pages", async () => {
          expect(createRequests).toHaveLength(19);
        });

        it("should have sent data of page with title foo-parent-title", async () => {
          const pageRequest = findRequestByTitle(
            "foo-parent-title",
            createRequests,
          );

          expect(pageRequest).toBeDefined();
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
                value: expect.stringContaining(
                  dedent(`
                  <p><strong>AUTOMATION NOTICE: This page is synced automatically, changes made manually will be lost</strong></p><h1>Title</h1>
                  <blockquote>
                  <p><strong>Note:</strong></p>
                  <p>⭐ this is an admonition</p>
                  </blockquote>
                  <h2>External Link</h2>
                  <p>This is a link:</p>
                  <p><a href="https://httpbin.org">External link</a></p>
                  <h2>Internal Link</h2>
                  <p>This is a link:</p>
                  <p><ac:link><ri:page ri:content-title="[foo-parent-title] foo-child1-title" ri:space-key="foo-space-id"></ri:page><ac:plain-text-link-body><![CDATA[Internal link]]></ac:plain-text-link-body></ac:link></p>
                  <h2>Mdx Code Block</h2>
                  <p>This is a mdx code block:</p>
                  <h2>Details</h2>
                  <!-- eslint-disable-next-line markdown/no-html -->
                  <ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">Details</ac:parameter><ac:rich-text-body><pre><code class="language-markdown">    :::caution Status
                      Proposed
                      :::
                  </code></pre></ac:rich-text-body></ac:structured-macro>
                  <h2>Footnotes</h2>
                  <p>This is a paragraph with a footnote.</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        it("when file contains mdx code blocks should have removed the mdx code blocks", async () => {
          const pageRequest = findRequestByTitle(
            "foo-parent-title",
            createRequests,
          );

          expect(pageRequest?.body?.body).toEqual({
            storage: expect.objectContaining({
              value: expect.not.stringContaining(
                dedent`
                  <h2>Mdx Code Block</h2>
                  <p>This is a mdx code block:</p>
                  <pre><code class="language-mdx-code-block">Mdx code block test
                  </code></pre>
                `,
              ),
            }),
          });
        });

        it("should have sent data of page with title foo-child1-title", async () => {
          const pageRequest = findRequestByTitle(
            "[foo-parent-title] foo-child1-title",
            createRequests,
          );

          expect(pageRequest).toBeDefined();
          expect(pageRequest?.url).toBe("/rest/api/content");
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title] foo-child1-title",
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
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the child1 title</h1>
                  <p>This is the child1 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        it("should have sent data of page with title foo-child2-title", async () => {
          const pageRequest = findRequestByTitle(
            "[foo-parent-title] foo-child2-title",
            createRequests,
          );

          expect(pageRequest).toBeDefined();
          expect(pageRequest?.url).toBe("/rest/api/content");
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title] foo-child2-title",
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
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the child2 title</h1>
                  <p>This is the child2 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        it("should have sent data of page with title foo-grandChild1-title", async () => {
          const pageRequest = findRequestByTitle(
            "[foo-parent-title][foo-child1-title] foo-grandChild1-title",
            createRequests,
          );

          expect(pageRequest).toBeDefined();
          expect(pageRequest?.url).toBe("/rest/api/content");
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title][foo-child1-title] foo-grandChild1-title",
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
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the grandChild1 title</h1>
                  <p>This is the grandChild1 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        it("should have sent data of page with title foo-grandChild3-title", async () => {
          const pageRequest = findRequestByTitle(
            "[foo-parent-title][foo-child2-title] foo-grandChild3-title",
            createRequests,
          );

          expect(pageRequest).toBeDefined();
          expect(pageRequest?.url).toBe("/rest/api/content");
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title][foo-child2-title] foo-grandChild3-title",
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
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the grandChild3 title</h1>
                  <p>This is the grandChild3 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        it("should create pages where the category does not have index.md", async () => {
          const emptyCategoryRequest = findRequestByTitle(
            "[foo-parent-title] foo-child3-title",
            createRequests,
          );

          expect(emptyCategoryRequest?.url).toBe("/rest/api/content");
          expect(emptyCategoryRequest?.method).toBe("POST");
          expect(emptyCategoryRequest?.headers?.authorization).toBe(
            "Bearer foo-token",
          );
          expect(emptyCategoryRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title] foo-child3-title",
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
                value: expect.any(String),
                representation: "storage",
              },
            },
          });

          const pageRequest = findRequestByTitle(
            "[foo-parent-title][foo-child3-title] foo-grandChild5-title",
            createRequests,
          );

          expect(pageRequest).toBeDefined();
          expect(pageRequest?.url).toBe("/rest/api/content");
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title][foo-child3-title] foo-grandChild5-title",
            space: {
              key: "foo-space-id",
            },
            ancestors: [
              {
                id: "foo-child3-id",
              },
            ],
            body: {
              storage: {
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the grandChild5 title</h1>
                  <p>This is the grandChild5 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });
      });

      describe("when creating pages with name", () => {
        it("should create category propagate name to children's titles", async () => {
          const categoryWithSlug = findRequestByTitle(
            "[foo-parent-title] foo-child4-title",
            createRequests,
          );

          expect(categoryWithSlug?.url).toBe("/rest/api/content");
          expect(categoryWithSlug?.method).toBe("POST");
          expect(categoryWithSlug?.headers?.authorization).toBe(
            "Bearer foo-token",
          );
          expect(categoryWithSlug?.body).toEqual({
            type: "page",
            title: "[foo-parent-title] foo-child4-title",
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
                value: expect.stringContaining(
                  dedent(`
              <h1>Here goes the child4 title</h1>
              <p>This is the child4 content</p>
              `),
                ),
                representation: "storage",
              },
            },
          });

          const subCategoryWithSlugRequest = findRequestByTitle(
            "[foo-parent-title][child4] foo-grandChild6-title",
            createRequests,
          );

          expect(subCategoryWithSlugRequest?.url).toBe("/rest/api/content");
          expect(subCategoryWithSlugRequest?.method).toBe("POST");
          expect(subCategoryWithSlugRequest?.headers?.authorization).toBe(
            "Bearer foo-token",
          );
          expect(subCategoryWithSlugRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title][child4] foo-grandChild6-title",
            space: {
              key: "foo-space-id",
            },
            ancestors: [
              {
                id: "foo-child4-id",
              },
            ],
            body: {
              storage: {
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the grandChild6 title</h1>
                  <p>This is the grandChild6 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });

          const pageWithSlugRequest = findRequestByTitle(
            "[foo-parent-title][child4] foo-grandChild7-title",
            createRequests,
          );

          expect(pageWithSlugRequest?.url).toBe("/rest/api/content");
          expect(pageWithSlugRequest?.method).toBe("POST");
          expect(pageWithSlugRequest?.headers?.authorization).toBe(
            "Bearer foo-token",
          );
          expect(pageWithSlugRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title][child4] foo-grandChild7-title",
            space: {
              key: "foo-space-id",
            },
            ancestors: [
              {
                id: "foo-child4-id",
              },
            ],
            body: {
              storage: {
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the grandChild7 title</h1>
                  <p>This is the grandChild7 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        it("should create category propagate name to children's titles when category metadata is present", async () => {
          const categoryWithSlug = findRequestByTitle(
            "[foo-parent-title] foo-child5-title",
            createRequests,
          );

          expect(categoryWithSlug?.url).toBe("/rest/api/content");
          expect(categoryWithSlug?.method).toBe("POST");
          expect(categoryWithSlug?.headers?.authorization).toBe(
            "Bearer foo-token",
          );
          expect(categoryWithSlug?.body).toEqual({
            type: "page",
            title: "[foo-parent-title] foo-child5-title",
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
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the child5 title</h1>
                  <p>This is the child5 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });

          const pageWithoutSlugRequest = findRequestByTitle(
            "[foo-parent-title][child5] foo-grandChild8-title",
            createRequests,
          );

          expect(pageWithoutSlugRequest?.url).toBe("/rest/api/content");
          expect(pageWithoutSlugRequest?.method).toBe("POST");
          expect(pageWithoutSlugRequest?.headers?.authorization).toBe(
            "Bearer foo-token",
          );
          expect(pageWithoutSlugRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title][child5] foo-grandChild8-title",
            space: {
              key: "foo-space-id",
            },
            ancestors: [
              {
                id: "foo-child5-id",
              },
            ],
            body: {
              storage: {
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the grandChild8 title</h1>
                  <p>This is the grandChild8 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        describe("great grand children with same title", () => {
          it("should create pages with same title", async () => {
            const firstPageWithSameTitle = findRequestByTitle(
              "[foo-parent-title][foo-child6-title][foo-grandChild9-title] foo-greatGrandChild-title",
              createRequests,
            );

            expect(firstPageWithSameTitle?.url).toBe("/rest/api/content");
            expect(firstPageWithSameTitle?.method).toBe("POST");
            expect(firstPageWithSameTitle?.headers?.authorization).toBe(
              "Bearer foo-token",
            );
            expect(firstPageWithSameTitle?.body).toEqual({
              type: "page",
              title:
                "[foo-parent-title][foo-child6-title][foo-grandChild9-title] foo-greatGrandChild-title",
              space: {
                key: "foo-space-id",
              },
              ancestors: [
                {
                  id: "foo-grandChild9-id",
                },
              ],
              body: {
                storage: {
                  value: expect.stringContaining(
                    dedent(`
                    <h1>Here goes the greatGrandChild1 title</h1>
                    <p>This is the greatGrandChild1 content</p>
                    `),
                  ),
                  representation: "storage",
                },
              },
            });

            const secondPageWithSameTitle = findRequestByTitle(
              "[foo-parent-title][foo-child6-title][foo-grandChild10-title] foo-greatGrandChild-title",
              createRequests,
            );

            expect(secondPageWithSameTitle?.url).toBe("/rest/api/content");
            expect(secondPageWithSameTitle?.method).toBe("POST");
            expect(secondPageWithSameTitle?.headers?.authorization).toBe(
              "Bearer foo-token",
            );
            expect(secondPageWithSameTitle?.body).toEqual({
              type: "page",
              title:
                "[foo-parent-title][foo-child6-title][foo-grandChild10-title] foo-greatGrandChild-title",
              space: {
                key: "foo-space-id",
              },
              ancestors: [
                {
                  id: "foo-grandChild10-id",
                },
              ],
              body: {
                storage: {
                  value: expect.stringContaining(
                    dedent(`
                    <h1>Here goes the greatGrandChild2 title</h1>
                    <p>This is the greatGrandChild2 content</p>
                    `),
                  ),
                  representation: "storage",
                },
              },
            });
          });
        });
      });
    });

    describe("when passing files metadata in config", () => {
      beforeAll(async () => {
        await changeMockCollection("empty-root");
        await resetRequests();

        cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
          cwd: getFixtureFolder("mock-server-empty-root-files-metadata"),
          silent: false,
          env: {
            MARKDOWN_CONFLUENCE_SYNC_LOG_LEVEL: "debug",
          },
        });

        const result = await cli.run();
        exitCode = result.exitCode;
        logs = result.logs;

        createRequests = await getRequestsByRouteId("confluence-create-page");
      });

      afterAll(async () => {
        await cli.kill();
      });

      describe("when creating pages", () => {
        it("should have exit code 0", async () => {
          expect(exitCode).toBe(0);
        });

        it("should have logged pages to sync", async () => {
          expect(cleanLogs(logs)).toContain(
            `Converting 19 markdown documents to Confluence pages...`,
          );
        });

        it("should have debug log level", async () => {
          expect(cleanLogs(logs)).toContain(
            `Found 19 pages in ${resolve(getFixtureFolder("mock-server-empty-root-files-metadata"), "docs")}`,
          );
        });

        it("should have created 19 pages", async () => {
          expect(createRequests).toHaveLength(19);
        });

        it("should have sent data of page with title foo-parent-title", async () => {
          const pageRequest = findRequestByTitle(
            "foo-parent-title",
            createRequests,
          );

          expect(pageRequest).toBeDefined();
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
                value: expect.stringContaining(
                  dedent(`
                  <p><strong>AUTOMATION NOTICE: This page is synced automatically, changes made manually will be lost</strong></p><h1>Title</h1>
                  <blockquote>
                  <p><strong>Note:</strong></p>
                  <p>⭐ this is an admonition</p>
                  </blockquote>
                  <h2>External Link</h2>
                  <p>This is a link:</p>
                  <p><a href="https://httpbin.org">External link</a></p>
                  <h2>Internal Link</h2>
                  <p>This is a link:</p>
                  <p><ac:link><ri:page ri:content-title="[foo-parent-title] foo-child1-title" ri:space-key="foo-space-id"></ri:page><ac:plain-text-link-body><![CDATA[Internal link]]></ac:plain-text-link-body></ac:link></p>
                  <h2>Mdx Code Block</h2>
                  <p>This is a mdx code block:</p>
                  <h2>Details</h2>
                  <!-- eslint-disable-next-line markdown/no-html -->
                  <ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">Details</ac:parameter><ac:rich-text-body><pre><code class="language-markdown">    :::caution Status
                      Proposed
                      :::
                  </code></pre></ac:rich-text-body></ac:structured-macro>
                  <h2>Footnotes</h2>
                  <p>This is a paragraph with a footnote.</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        it("when file contains mdx code blocks should have removed the mdx code blocks", async () => {
          const pageRequest = findRequestByTitle(
            "foo-parent-title",
            createRequests,
          );

          expect(pageRequest?.body?.body).toEqual({
            storage: expect.objectContaining({
              value: expect.not.stringContaining(
                dedent`
                  <h2>Mdx Code Block</h2>
                  <p>This is a mdx code block:</p>
                  <pre><code class="language-mdx-code-block">Mdx code block test
                  </code></pre>
                `,
              ),
            }),
          });
        });

        it("should have sent data of page with title foo-child1-title", async () => {
          const pageRequest = findRequestByTitle(
            "[foo-parent-title] foo-child1-title",
            createRequests,
          );

          expect(pageRequest).toBeDefined();
          expect(pageRequest?.url).toBe("/rest/api/content");
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title] foo-child1-title",
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
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the child1 title</h1>
                  <p>This is the child1 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        it("should have sent data of page with title foo-child2-title", async () => {
          const pageRequest = findRequestByTitle(
            "[foo-parent-title] foo-child2-title",
            createRequests,
          );

          expect(pageRequest).toBeDefined();
          expect(pageRequest?.url).toBe("/rest/api/content");
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title] foo-child2-title",
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
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the child2 title</h1>
                  <p>This is the child2 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        it("should have sent data of page with title foo-grandChild1-title", async () => {
          const pageRequest = findRequestByTitle(
            "[foo-parent-title][foo-child1-title] foo-grandChild1-title",
            createRequests,
          );

          expect(pageRequest).toBeDefined();
          expect(pageRequest?.url).toBe("/rest/api/content");
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title][foo-child1-title] foo-grandChild1-title",
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
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the grandChild1 title</h1>
                  <p>This is the grandChild1 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        it("should have sent data of page with title foo-grandChild3-title", async () => {
          const pageRequest = findRequestByTitle(
            "[foo-parent-title][foo-child2-title] foo-grandChild3-title",
            createRequests,
          );

          expect(pageRequest).toBeDefined();
          expect(pageRequest?.url).toBe("/rest/api/content");
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title][foo-child2-title] foo-grandChild3-title",
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
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the grandChild3 title</h1>
                  <p>This is the grandChild3 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        it("should create pages where the category does not have index.md", async () => {
          const emptyCategoryRequest = findRequestByTitle(
            "[foo-parent-title] foo-child3-title",
            createRequests,
          );

          expect(emptyCategoryRequest?.url).toBe("/rest/api/content");
          expect(emptyCategoryRequest?.method).toBe("POST");
          expect(emptyCategoryRequest?.headers?.authorization).toBe(
            "Bearer foo-token",
          );
          expect(emptyCategoryRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title] foo-child3-title",
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
                value: expect.any(String),
                representation: "storage",
              },
            },
          });

          const pageRequest = findRequestByTitle(
            "[foo-parent-title][foo-child3-title] foo-grandChild5-title",
            createRequests,
          );

          expect(pageRequest).toBeDefined();
          expect(pageRequest?.url).toBe("/rest/api/content");
          expect(pageRequest?.method).toBe("POST");
          expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
          expect(pageRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title][foo-child3-title] foo-grandChild5-title",
            space: {
              key: "foo-space-id",
            },
            ancestors: [
              {
                id: "foo-child3-id",
              },
            ],
            body: {
              storage: {
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the grandChild5 title</h1>
                  <p>This is the grandChild5 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });
      });

      describe("when creating pages with name", () => {
        it("should create category propagate name to children's titles", async () => {
          const categoryWithSlug = findRequestByTitle(
            "[foo-parent-title] foo-child4-title",
            createRequests,
          );

          expect(categoryWithSlug?.url).toBe("/rest/api/content");
          expect(categoryWithSlug?.method).toBe("POST");
          expect(categoryWithSlug?.headers?.authorization).toBe(
            "Bearer foo-token",
          );
          expect(categoryWithSlug?.body).toEqual({
            type: "page",
            title: "[foo-parent-title] foo-child4-title",
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
                value: expect.stringContaining(
                  dedent(`
              <h1>Here goes the child4 title</h1>
              <p>This is the child4 content</p>
              `),
                ),
                representation: "storage",
              },
            },
          });

          const subCategoryWithSlugRequest = findRequestByTitle(
            "[foo-parent-title][child4] foo-grandChild6-title",
            createRequests,
          );

          expect(subCategoryWithSlugRequest?.url).toBe("/rest/api/content");
          expect(subCategoryWithSlugRequest?.method).toBe("POST");
          expect(subCategoryWithSlugRequest?.headers?.authorization).toBe(
            "Bearer foo-token",
          );
          expect(subCategoryWithSlugRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title][child4] foo-grandChild6-title",
            space: {
              key: "foo-space-id",
            },
            ancestors: [
              {
                id: "foo-child4-id",
              },
            ],
            body: {
              storage: {
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the grandChild6 title</h1>
                  <p>This is the grandChild6 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });

          const pageWithSlugRequest = findRequestByTitle(
            "[foo-parent-title][child4] foo-grandChild7-title",
            createRequests,
          );

          expect(pageWithSlugRequest?.url).toBe("/rest/api/content");
          expect(pageWithSlugRequest?.method).toBe("POST");
          expect(pageWithSlugRequest?.headers?.authorization).toBe(
            "Bearer foo-token",
          );
          expect(pageWithSlugRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title][child4] foo-grandChild7-title",
            space: {
              key: "foo-space-id",
            },
            ancestors: [
              {
                id: "foo-child4-id",
              },
            ],
            body: {
              storage: {
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the grandChild7 title</h1>
                  <p>This is the grandChild7 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        it("should create category propagate name to children's titles when category metadata is present", async () => {
          const categoryWithSlug = findRequestByTitle(
            "[foo-parent-title] foo-child5-title",
            createRequests,
          );

          expect(categoryWithSlug?.url).toBe("/rest/api/content");
          expect(categoryWithSlug?.method).toBe("POST");
          expect(categoryWithSlug?.headers?.authorization).toBe(
            "Bearer foo-token",
          );
          expect(categoryWithSlug?.body).toEqual({
            type: "page",
            title: "[foo-parent-title] foo-child5-title",
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
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the child5 title</h1>
                  <p>This is the child5 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });

          const pageWithoutSlugRequest = findRequestByTitle(
            "[foo-parent-title][child5] foo-grandChild8-title",
            createRequests,
          );

          expect(pageWithoutSlugRequest?.url).toBe("/rest/api/content");
          expect(pageWithoutSlugRequest?.method).toBe("POST");
          expect(pageWithoutSlugRequest?.headers?.authorization).toBe(
            "Bearer foo-token",
          );
          expect(pageWithoutSlugRequest?.body).toEqual({
            type: "page",
            title: "[foo-parent-title][child5] foo-grandChild8-title",
            space: {
              key: "foo-space-id",
            },
            ancestors: [
              {
                id: "foo-child5-id",
              },
            ],
            body: {
              storage: {
                value: expect.stringContaining(
                  dedent(`
                  <h1>Here goes the grandChild8 title</h1>
                  <p>This is the grandChild8 content</p>
                  `),
                ),
                representation: "storage",
              },
            },
          });
        });

        describe("great grand children with same title", () => {
          it("should create pages with same title", async () => {
            const firstPageWithSameTitle = findRequestByTitle(
              "[foo-parent-title][foo-child6-title][foo-grandChild9-title] foo-greatGrandChild-title",
              createRequests,
            );

            expect(firstPageWithSameTitle?.url).toBe("/rest/api/content");
            expect(firstPageWithSameTitle?.method).toBe("POST");
            expect(firstPageWithSameTitle?.headers?.authorization).toBe(
              "Bearer foo-token",
            );
            expect(firstPageWithSameTitle?.body).toEqual({
              type: "page",
              title:
                "[foo-parent-title][foo-child6-title][foo-grandChild9-title] foo-greatGrandChild-title",
              space: {
                key: "foo-space-id",
              },
              ancestors: [
                {
                  id: "foo-grandChild9-id",
                },
              ],
              body: {
                storage: {
                  value: expect.stringContaining(
                    dedent(`
                    <h1>Here goes the greatGrandChild1 title</h1>
                    <p>This is the greatGrandChild1 content</p>
                    `),
                  ),
                  representation: "storage",
                },
              },
            });

            const secondPageWithSameTitle = findRequestByTitle(
              "[foo-parent-title][foo-child6-title][foo-grandChild10-title] foo-greatGrandChild-title",
              createRequests,
            );

            expect(secondPageWithSameTitle?.url).toBe("/rest/api/content");
            expect(secondPageWithSameTitle?.method).toBe("POST");
            expect(secondPageWithSameTitle?.headers?.authorization).toBe(
              "Bearer foo-token",
            );
            expect(secondPageWithSameTitle?.body).toEqual({
              type: "page",
              title:
                "[foo-parent-title][foo-child6-title][foo-grandChild10-title] foo-greatGrandChild-title",
              space: {
                key: "foo-space-id",
              },
              ancestors: [
                {
                  id: "foo-grandChild10-id",
                },
              ],
              body: {
                storage: {
                  value: expect.stringContaining(
                    dedent(`
                    <h1>Here goes the greatGrandChild2 title</h1>
                    <p>This is the greatGrandChild2 content</p>
                    `),
                  ),
                  representation: "storage",
                },
              },
            });
          });
        });
      });
    });

    describe("when dryRun option is true", () => {
      beforeAll(async () => {
        await changeMockCollection("empty-root");
        await resetRequests();

        cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
          cwd: getFixtureFolder("mock-server-empty-root"),
          silent: true,
          env: {
            MARKDOWN_CONFLUENCE_SYNC_CONFLUENCE_DRY_RUN: "true",
          },
        });

        const result = await cli.run();
        exitCode = result.exitCode;
        logs = result.logs;

        createRequests = await getRequestsByRouteId("confluence-create-page");
      });

      afterAll(async () => {
        await cli.kill();
      });

      it("should have exit code 0", async () => {
        expect(exitCode).toBe(0);
      });

      it("should have logged pages to sync", async () => {
        expect(cleanLogs(logs)).toContain(
          `Converting 19 markdown documents to Confluence pages...`,
        );
      });

      it("should have created 0 pages", async () => {
        expect(createRequests).toHaveLength(0);
      });
    });

    describe("when the root page has children (pagesNoRoot input and default-root mock)", () => {
      beforeAll(async () => {
        await changeMockCollection("default-root");
        await resetRequests();

        cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
          cwd: getFixtureFolder("mock-server-default-root"),
          silent: true,
          env: {
            MARKDOWN_CONFLUENCE_SYNC_LOG_LEVEL: "debug",
          },
        });

        const result = await cli.run();
        exitCode = result.exitCode;
        logs = result.logs;

        createRequests = await getRequestsByRouteId("confluence-create-page");
        updateRequests = await getRequestsByRouteId("confluence-update-page");
        deleteRequests = await getRequestsByRouteId("confluence-delete-page");
        createAttachmentsRequests = await getRequestsByRouteId(
          "confluence-create-attachments",
        );
      });

      afterAll(async () => {
        await cli.kill();
      });

      it("should have exit code 0", async () => {
        expect(exitCode).toBe(0);
      });

      it("should have logged pages to sync", async () => {
        expect(cleanLogs(logs)).toContain(
          `Converting 6 markdown documents to Confluence pages...`,
        );
      });

      it("should have debug log level", async () => {
        expect(cleanLogs(logs)).toContain(
          `Found 6 pages in ${resolve(getFixtureFolder("mock-server-default-root"), "docs")}`,
        );
      });

      it("should have created 3 pages", async () => {
        expect(createRequests).toHaveLength(3);
      });

      it("should have create page with title foo-child3-title which folder only have an index.md", async () => {
        const pageRequest = findRequestByTitle(
          "[foo-parent-title] foo-child3-title",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "[foo-parent-title] foo-child3-title",
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
              value: expect.stringContaining(
                dedent(`
                <h1>Here goes the child3 title</h1>
                <p>This is the child3 content</p>
                `),
              ),
              representation: "storage",
            },
          },
        });
      });

      it("should have create page with title foo-grandChild3-title", async () => {
        const pageRequest = findRequestByTitle(
          "[foo-parent-title][foo-child2-title] foo-grandChild3-title",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "[foo-parent-title][foo-child2-title] foo-grandChild3-title",
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
              value: expect.stringContaining(
                dedent(`
                <h1>Here goes the grandChild3 title</h1>
                <p>This is the grandChild3 content</p>
                `),
              ),
              representation: "storage",
            },
          },
        });
      });

      it("should have updated 3 pages", async () => {
        expect(updateRequests).toHaveLength(3);
      });

      it("should have update page with title foo-child1-title", async () => {
        const pageRequest = findRequestByTitle(
          "[foo-parent-title] foo-child1-title",
          updateRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.url).toBe("/rest/api/content/foo-child1-id");
        expect(pageRequest?.method).toBe("PUT");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "[foo-parent-title] foo-child1-title",
          version: {
            number: 2,
          },
          ancestors: [
            {
              id: "foo-parent-id",
            },
          ],
          body: {
            storage: {
              value: expect.stringContaining(
                dedent(`
                <h1>Here goes the child1 title</h1>
                <p>This is the child1 content</p>
                `),
              ),
              representation: "storage",
            },
          },
        });
      });

      it("should have deleted 1 page and 1 attachment", async () => {
        expect(deleteRequests).toHaveLength(2);
      });

      it("should have delete page with id foo-grandChild2-id", async () => {
        const pageRequest = findRequestById(
          "foo-grandChild2-id",
          deleteRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.url).toBe("/rest/api/content/foo-grandChild2-id");
        expect(pageRequest?.method).toBe("DELETE");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({});
      });

      it("should have delete attachment with id foo-grandChild1-attachment-id", async () => {
        const pageRequest = findRequestById(
          "foo-grandChild1-attachment-id",
          deleteRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.url).toBe(
          "/rest/api/content/foo-grandChild1-attachment-id",
        );
        expect(pageRequest?.method).toBe("DELETE");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({});
      });

      it("should have created 1 attachment", async () => {
        expect(createAttachmentsRequests).toHaveLength(1);
      });

      it("should have create attachment for page with id foo-parent-id", async () => {
        const pageRequest = findRequestById(
          "foo-parent-id",
          createAttachmentsRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.url).toBe(
          "/rest/api/content/foo-parent-id/child/attachment",
        );
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.headers?.["x-atlassian-token"]).toBe("no-check");
        expect(pageRequest?.headers?.["content-type"]).toContain(
          "multipart/form-data",
        );
      });
    });

    describe("when pages have confluence_title", () => {
      beforeAll(async () => {
        await changeMockCollection("with-confluence-title");
        await resetRequests();

        cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
          cwd: getFixtureFolder("mock-server-with-confluence-title"),
          silent: true,
        });

        const result = await cli.run();
        exitCode = result.exitCode;
        logs = result.logs;

        createRequests = await getRequestsByRouteId("confluence-create-page");
      });

      it("should have exit code 0", async () => {
        expect(exitCode).toBe(0);
      });

      it("should have created 3 pages", async () => {
        expect(createRequests).toHaveLength(3);
      });

      it("should have create page with title Confluence title", async () => {
        const pageRequest = findRequestByTitle(
          "Confluence title",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "Confluence title",
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
              value: expect.stringContaining(
                dedent(`
                <h1>Hello World</h1>
                `),
              ),
              representation: "storage",
            },
          },
        });
      });

      it("should have create page with title [Confluence title][foo-child1-title] Confluence grandChild 1", async () => {
        const pageRequest = findRequestByTitle(
          "[Confluence title][foo-child1-title] Confluence grandChild 1",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "[Confluence title][foo-child1-title] Confluence grandChild 1",
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
              value: expect.stringContaining(
                dedent(`
                <h1>Here goes the grandChild1 title</h1>
                <p>This is the grandChild1 content</p>
                `),
              ),
              representation: "storage",
            },
          },
        });
      });
    });

    describe("when using cwd option", () => {
      beforeAll(async () => {
        await changeMockCollection("with-confluence-title");
        await resetRequests();

        cli = new ChildProcessManager(["./run.mjs"], {
          cwd: getFixtureFolder("working-directory"),
          //silent: true,
        });

        const result = await cli.run();
        exitCode = result.exitCode;
        logs = result.logs;

        createRequests = await getRequestsByRouteId("confluence-create-page");
      });

      it("should have exit code 0", async () => {
        expect(exitCode).toBe(0);
      });

      it("should have created 3 pages", async () => {
        expect(createRequests).toHaveLength(3);
      });

      it("should have create page with title Confluence title", async () => {
        const pageRequest = findRequestByTitle(
          "Confluence title",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "Confluence title",
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
              value: expect.stringContaining(
                dedent(`
                <h1>Hello World</h1>
                `),
              ),
              representation: "storage",
            },
          },
        });
      });

      it("should have create page with title [Confluence title][foo-child1-title] Confluence grandChild 1", async () => {
        const pageRequest = findRequestByTitle(
          "[Confluence title][foo-child1-title] Confluence grandChild 1",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "[Confluence title][foo-child1-title] Confluence grandChild 1",
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
              value: expect.stringContaining(
                dedent(`
                <h1>Here goes the grandChild1 title</h1>
                <p>This is the grandChild1 content</p>
                `),
              ),
              representation: "storage",
            },
          },
        });
      });
    });

    describe("when using cwd env var", () => {
      beforeAll(async () => {
        await changeMockCollection("with-confluence-title");
        await resetRequests();

        cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
          cwd: getFixtureFolder("working-directory"),
          env: {
            MARKDOWN_CONFLUENCE_SYNC_CWD: resolve(
              getFixtureFolder("working-directory"),
              "subfolder",
            ),
          },
        });

        const result = await cli.run();
        exitCode = result.exitCode;
        logs = result.logs;

        createRequests = await getRequestsByRouteId("confluence-create-page");
      });

      it("should have exit code 0", async () => {
        expect(exitCode).toBe(0);
      });

      it("should have created 3 pages", async () => {
        expect(createRequests).toHaveLength(3);
      });

      it("should have create page with title Confluence title", async () => {
        const pageRequest = findRequestByTitle(
          "Confluence title",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "Confluence title",
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
              value: expect.stringContaining(
                dedent(`
                <h1>Hello World</h1>
                `),
              ),
              representation: "storage",
            },
          },
        });
      });

      it("should have create page with title [Confluence title][foo-child1-title] Confluence grandChild 1", async () => {
        const pageRequest = findRequestByTitle(
          "[Confluence title][foo-child1-title] Confluence grandChild 1",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.url).toBe("/rest/api/content");
        expect(pageRequest?.method).toBe("POST");
        expect(pageRequest?.headers?.authorization).toBe("Bearer foo-token");
        expect(pageRequest?.body).toEqual({
          type: "page",
          title: "[Confluence title][foo-child1-title] Confluence grandChild 1",
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
              value: expect.stringContaining(
                dedent(`
                <h1>Here goes the grandChild1 title</h1>
                <p>This is the grandChild1 content</p>
                `),
              ),
              representation: "storage",
            },
          },
        });
      });
    });

    describe("when files in the root directory", () => {
      beforeAll(async () => {
        await changeMockCollection("empty-root");
        await resetRequests();

        cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
          cwd: getFixtureFolder("mock-server-with-files-in-root"),
          silent: true,
        });

        const result = await cli.run();
        exitCode = result.exitCode;
        logs = result.logs;

        createRequests = await getRequestsByRouteId("confluence-create-page");
      });

      it("should have exit code 0", async () => {
        expect(exitCode).toBe(0);
      });

      it("should ignore index.md in the root directory", () => {
        expect(cleanLogs(logs)).toContain(
          `Ignoring index.md file in root directory.`,
        );
      });

      it("should ignore pages not configured to sync", () => {
        expect(createRequests).not.toContainEqual(
          expect.objectContaining({
            body: expect.objectContaining({
              title: "foo-ignored-parent-title",
            }),
          }),
        );
      });

      it("should create pages configured to sync", () => {
        expect(createRequests).toContainEqual(
          expect.objectContaining({
            body: expect.objectContaining({
              title: "foo-parent-title",
            }),
          }),
        );
      });
    });

    describe("index files", () => {
      beforeAll(async () => {
        await changeMockCollection("with-alternative-index-files");
        await resetRequests();

        cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
          cwd: getFixtureFolder("mock-server-with-alternative-index-files"),
          silent: false,
          env: {
            MARKDOWN_CONFLUENCE_SYNC_LOG_LEVEL: "warn",
          },
        });

        const result = await cli.run();
        exitCode = result.exitCode;
        logs = result.logs;

        createRequests = await getRequestsByRouteId("confluence-create-page");
      });

      it("should have exit code 0", async () => {
        expect(exitCode).toBe(0);
      });

      it("should take index.md as index file when all the possible index files are present", () => {
        const pageRequest = findRequestByTitle("index.md", createRequests);

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.body).toEqual(
          expect.objectContaining({
            title: "index.md",
            ancestors: [
              {
                id: "foo-root-id",
              },
            ],
          }),
        );
      });

      it("should log a warning when more than one file that can be considered as index file is present", () => {
        expect(logs).toEqual(
          expect.arrayContaining([
            expect.stringContaining(
              `Multiple index files found in all-index-files directory. Using index.md as index file. Ignoring the rest.`,
            ),
          ]),
        );
      });

      it("should have send data of README.md", async () => {
        const pageRequest = findRequestByTitle("README", createRequests);

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.body).toEqual(
          expect.objectContaining({
            title: "README",
            ancestors: [
              {
                id: "foo-root-id",
              },
            ],
          }),
        );
      });

      it("should have send data of a child page with title [README] child", async () => {
        const pageRequest = findRequestByTitle(
          "[README] child",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.body).toEqual(
          expect.objectContaining({
            title: "[README] child",
            ancestors: [
              {
                id: "README-id",
              },
            ],
          }),
        );
      });

      it("should have send data of directory-name.md", async () => {
        const pageRequest = findRequestByTitle(
          "directory-name",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.body).toEqual(
          expect.objectContaining({
            title: "directory-name",
            ancestors: [
              {
                id: "foo-root-id",
              },
            ],
          }),
        );
      });

      it("should have send data of a child page with title [directory-name] child", async () => {
        const pageRequest = findRequestByTitle(
          "[directory-name] child",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.body).toEqual(
          expect.objectContaining({
            title: "[directory-name] child",
            ancestors: [
              {
                id: "directory-name-id",
              },
            ],
          }),
        );
      });

      it("should have send data of README.mdx", async () => {
        const pageRequest = findRequestByTitle("README-mdx", createRequests);

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.body).toEqual(
          expect.objectContaining({
            title: "README-mdx",
            ancestors: [
              {
                id: "foo-root-id",
              },
            ],
          }),
        );
      });

      it("should have send data of a child page with title [README-mdx] child", async () => {
        const pageRequest = findRequestByTitle(
          "[README-mdx] child",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.body).toEqual(
          expect.objectContaining({
            title: "[README-mdx] child",
            ancestors: [
              {
                id: "README-mdx-id",
              },
            ],
          }),
        );
      });

      it("should have send data of directory-name-2.mdx", async () => {
        const pageRequest = findRequestByTitle(
          "directory-name-2-mdx",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.body).toEqual(
          expect.objectContaining({
            title: "directory-name-2-mdx",
            ancestors: [
              {
                id: "foo-root-id",
              },
            ],
          }),
        );
      });

      it("should have send data of a child page with title [directory-name-2-mdx] child", async () => {
        const pageRequest = findRequestByTitle(
          "[directory-name-2-mdx] child",
          createRequests,
        );

        expect(pageRequest).toBeDefined();
        expect(pageRequest?.body).toEqual(
          expect.objectContaining({
            title: "[directory-name-2-mdx] child",
            ancestors: [
              {
                id: "directory-name-2-mdx-id",
              },
            ],
          }),
        );
      });
    });
  });

  describe("with root page name option", () => {
    let createRequests: SpyRequest[];
    let cli: ChildProcessManagerInterface;
    let exitCode: number | null;

    beforeAll(async () => {
      await changeMockCollection("with-root-page-name");
      await resetRequests();

      cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
        cwd: getFixtureFolder("mock-server-with-root-page-name"),
        silent: true,
      });

      const result = await cli.run();
      exitCode = result.exitCode;

      createRequests = await getRequestsByRouteId("confluence-create-page");
    });

    it("should have exit code 0", async () => {
      expect(exitCode).toBe(0);
    });

    it("should have created 1 page with title foo-root-title", async () => {
      expect(createRequests).toHaveLength(1);
      expect(createRequests).toContainEqual(
        expect.objectContaining({
          body: expect.objectContaining({
            title: "[foo-root-name] foo-parent-title",
          }),
        }),
      );
    });

    describe("notice option", () => {
      describe("with default message", () => {
        beforeAll(async () => {
          await changeMockCollection("with-root-page-name");
          await resetRequests();

          cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
            cwd: getFixtureFolder("mock-server-with-root-page-name"),
            silent: true,
          });

          const result = await cli.run();
          exitCode = result.exitCode;

          createRequests = await getRequestsByRouteId("confluence-create-page");
        });

        it("should have exit code 0", async () => {
          expect(exitCode).toBe(0);
        });

        it("should have created 1 page with title foo-root-title", async () => {
          expect(createRequests).toHaveLength(1);
          expect(createRequests).toContainEqual(
            expect.objectContaining({
              body: expect.objectContaining({
                title: "[foo-root-name] foo-parent-title",
                body: expect.objectContaining({
                  storage: expect.objectContaining({
                    value: expect.stringContaining(
                      "AUTOMATION NOTICE: This page is synced automatically, changes made manually will be lost",
                    ),
                  }),
                }),
              }),
            }),
          );
        });
      });

      describe("with notice message", () => {
        beforeAll(async () => {
          await changeMockCollection("with-root-page-name");
          await resetRequests();

          cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
            cwd: getFixtureFolder("mock-server-with-root-page-name"),
            silent: true,
            env: {
              MARKDOWN_CONFLUENCE_SYNC_CONFLUENCE_NOTICE_MESSAGE:
                "This is a warning notice",
            },
          });

          const result = await cli.run();
          exitCode = result.exitCode;

          createRequests = await getRequestsByRouteId("confluence-create-page");
        });

        it("should have exit code 0", async () => {
          expect(exitCode).toBe(0);
        });

        it("should have created 1 page with title foo-root-title", async () => {
          expect(createRequests).toHaveLength(1);
          expect(createRequests).toContainEqual(
            expect.objectContaining({
              body: expect.objectContaining({
                title: "[foo-root-name] foo-parent-title",
                body: expect.objectContaining({
                  storage: expect.objectContaining({
                    value: expect.stringContaining("This is a warning notice"),
                  }),
                }),
              }),
            }),
          );
        });
      });

      describe("with notice template", () => {
        describe("invalid format", () => {
          let logs: string[];

          beforeAll(async () => {
            await changeMockCollection("with-root-page-name");
            await resetRequests();

            cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
              cwd: getFixtureFolder("mock-server-with-root-page-name"),
              silent: true,
              env: {
                MARKDOWN_CONFLUENCE_SYNC_LOG_LEVEL: "error",
                MARKDOWN_CONFLUENCE_SYNC_CONFLUENCE_NOTICE_TEMPLATE:
                  "{{relativePath}",
              },
            });

            const result = await cli.run();
            exitCode = result.exitCode;
            logs = result.logs;

            createRequests = await getRequestsByRouteId(
              "confluence-create-page",
            );
          });

          it("should have exit code 1", async () => {
            expect(exitCode).toBe(1);
          });

          it("should have created 1 page with title foo-root-title", async () => {
            expect(logs).toContainEqual(
              expect.stringContaining(
                "Error occurs while rendering template: Error: Invalid notice template: {{relativePath}",
              ),
            );
          });
        });

        describe("and without notice message", () => {
          beforeAll(async () => {
            await changeMockCollection("with-root-page-name");
            await resetRequests();

            cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
              cwd: getFixtureFolder("mock-server-with-root-page-name"),
              silent: true,
              env: {
                MARKDOWN_CONFLUENCE_SYNC_CONFLUENCE_NOTICE_TEMPLATE:
                  "This page was generated from {{relativePath}} with title {{title}}. {{default}}",
              },
            });

            const result = await cli.run();
            exitCode = result.exitCode;

            createRequests = await getRequestsByRouteId(
              "confluence-create-page",
            );
          });

          it("should have exit code 0", async () => {
            expect(exitCode).toBe(0);
          });

          it("should have created 1 page with title foo-root-title", async () => {
            expect(createRequests).toHaveLength(1);
            expect(createRequests).toContainEqual(
              expect.objectContaining({
                body: expect.objectContaining({
                  title: "[foo-root-name] foo-parent-title",
                  body: expect.objectContaining({
                    storage: expect.objectContaining({
                      value: expect.stringContaining(
                        "This page was generated from parent/index.md with title [foo-root-name] foo-parent-title. AUTOMATION NOTICE: This page is synced automatically, changes made manually will be lost",
                      ),
                    }),
                  }),
                }),
              }),
            );
          });
        });

        describe("and with notice message", () => {
          beforeAll(async () => {
            await changeMockCollection("with-root-page-name");
            await resetRequests();

            cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
              cwd: getFixtureFolder("mock-server-with-root-page-name"),
              silent: true,
              env: {
                MARKDOWN_CONFLUENCE_SYNC_CONFLUENCE_NOTICE_TEMPLATE:
                  "This page was generated from {{relativePath}} with title {{title}}. {{message}}",
                MARKDOWN_CONFLUENCE_SYNC_CONFLUENCE_NOTICE_MESSAGE:
                  "This is a warning notice",
              },
            });

            const result = await cli.run();
            exitCode = result.exitCode;

            createRequests = await getRequestsByRouteId(
              "confluence-create-page",
            );
          });

          it("should have exit code 0", async () => {
            expect(exitCode).toBe(0);
          });

          it("should have created 1 page with title foo-root-title", async () => {
            expect(createRequests).toHaveLength(1);
            expect(createRequests).toContainEqual(
              expect.objectContaining({
                body: expect.objectContaining({
                  title: "[foo-root-name] foo-parent-title",
                  body: expect.objectContaining({
                    storage: expect.objectContaining({
                      value: expect.stringContaining(
                        "This page was generated from parent/index.md with title [foo-root-name] foo-parent-title. This is a warning notice",
                      ),
                    }),
                  }),
                }),
              }),
            );
          });
        });
      });
    });
  });

  describe("with notice option", () => {
    let createRequests: SpyRequest[];
    let cli: ChildProcessManagerInterface;
    let exitCode: number | null;

    beforeAll(async () => {
      await changeMockCollection("with-root-page-name");
      await resetRequests();

      cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
        cwd: getFixtureFolder("mock-server-with-root-page-name"),
        silent: true,
        env: {
          MARKDOWN_CONFLUENCE_SYNC_CONFLUENCE_NOTICE_MESSAGE:
            "This is a warning notice",
        },
      });

      const result = await cli.run();
      exitCode = result.exitCode;

      createRequests = await getRequestsByRouteId("confluence-create-page");
    });

    it("should have exit code 0", async () => {
      expect(exitCode).toBe(0);
    });

    it("should have created 1 page with title foo-root-title", async () => {
      expect(createRequests).toHaveLength(1);
      expect(createRequests).toContainEqual(
        expect.objectContaining({
          body: expect.objectContaining({
            title: "[foo-root-name] foo-parent-title",
            body: expect.objectContaining({
              storage: expect.objectContaining({
                value: expect.stringContaining("This is a warning notice"),
              }),
            }),
          }),
        }),
      );
    });
  });

  // TODO: Investigate why this test is failing in CI
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip("mermaid diagrams", () => {
    let createRequests: SpyRequest[];
    let cli: ChildProcessManagerInterface;
    let exitCode: number | null;
    let cwd: string;

    beforeAll(async () => {
      await changeMockCollection("empty-root");
      await resetRequests();

      cwd = getFixtureFolder("mock-server-with-mermaid-diagrams");
      cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
        cwd,
        silent: true,
        env: {
          MARKDOWN_CONFLUENCE_SYNC_LOG_LEVEL: "debug",
        },
      });

      const result = await cli.run();
      exitCode = result.exitCode;

      createRequests = await getRequestsByRouteId("confluence-create-page");
    });

    afterAll(async () => {
      const autogeneratedImages = await glob("**/mermaid-diagrams", {
        cwd,
        absolute: true,
      });
      for (const image of autogeneratedImages) {
        await rm(resolve(process.cwd(), image), {
          force: true,
          recursive: true,
        });
      }
    });

    it("should have exit code 0", async () => {
      expect(exitCode).toBe(0);
    });

    it("should have created 1 page without mermaid code block", async () => {
      expect(createRequests).toHaveLength(1);
    });

    describe("body content", () => {
      let createRequest: SpyRequest;

      beforeAll(async () => {
        createRequest = createRequests[0];
      });

      it("should not contain mermaid code block", async () => {
        expect(createRequest).toEqual(
          expect.objectContaining({
            body: expect.objectContaining({
              title: "foo-parent-title",
              body: expect.objectContaining({
                storage: expect.objectContaining({
                  value: expect.not
                    .stringContaining(dedent`<h1>Mermaid Diagram</h1>
                  <pre><code class=\"language-mermaid\">graph LR
                    A-->B
                  </code></pre>
                  `),
                }),
              }),
            }),
          }),
        );
      });

      // TODO: implement this when image attachment is supported <t:1257>
      it.todo("should not contain mermaid diagram image attachment");
    });

    it("should create mermaid diagram image in page folder", async () => {
      const autogeneratedImages = await glob(
        "**/mermaid-diagrams/autogenerated-*.svg",
        { cwd },
      );

      expect(autogeneratedImages).toHaveLength(1);
    });

    // TODO: implement this when image attachment is supported <t:1257>
    it.todo("should upload mermaid diagrams as attachments");
  });

  describe("with mdx files", () => {
    let createRequests: SpyRequest[];
    let cli: ChildProcessManagerInterface;
    let exitCode: number | null;

    beforeAll(async () => {
      await changeMockCollection("with-mdx-files");
      await resetRequests();

      cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
        cwd: getFixtureFolder("mock-server-with-mdx-files"),
        silent: true,
      });

      const result = await cli.run();
      exitCode = result.exitCode;

      createRequests = await getRequestsByRouteId("confluence-create-page");
    });

    it("should have exit code 0", async () => {
      expect(exitCode).toBe(0);
    });

    it("should have created 1 page containing the text 'Mdx Code Block'", async () => {
      expect(createRequests).toHaveLength(1);
      expect(createRequests).toContainEqual(
        expect.objectContaining({
          body: expect.objectContaining({
            title: "foo-parent-title",
            body: expect.objectContaining({
              storage: expect.objectContaining({
                value: expect.stringContaining("Mdx Code Block"),
              }),
            }),
          }),
        }),
      );
    });

    it("should have created 1 page converting Tabs tag", async () => {
      expect(createRequests).toHaveLength(1);
      expect(createRequests).toContainEqual(
        expect.objectContaining({
          body: expect.objectContaining({
            title: "foo-parent-title",
            body: expect.objectContaining({
              storage: expect.objectContaining({
                value: expect.stringContaining(
                  dedent(`<h2>Mdx Code Block</h2>
                <p>This is a mdx code block:</p>
                <ul>
                <li>
                <p>File tree</p>
                <p>Tab Item Content</p>
                <blockquote>
                <p><strong>Tip: title</strong></p>
                <p>This is a tip</p>
                </blockquote>
                <ul>
                <li>
                <p>File tree</p>
                <p>Tab Item Content</p>
                </li>
                <li>
                <p>File tree</p>
                <p>Tab Item Content</p>
                <blockquote>
                <p><strong>Note:</strong></p>
                <p>This is a note</p>
                </blockquote>
                </li>
                </ul>
                </li>
                <li>
                <p>File tree</p>
                <p>Tab Item Content</p>
                </li>
                </ul>`),
                ),
              }),
            }),
          }),
        }),
      );
    });
  });
});
