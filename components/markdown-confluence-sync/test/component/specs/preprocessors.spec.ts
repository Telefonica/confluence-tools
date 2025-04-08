// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { ChildProcessManagerInterface } from "@telefonica/child-process-manager";
import { ChildProcessManager } from "@telefonica/child-process-manager";
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
import { join } from "path";

describe("preprocessor", () => {
  describe("should change content", () => {
    let createRequests: SpyRequest[];
    let cli: ChildProcessManagerInterface;
    let exitCode: number | null;
    let logs: string[];

    function findRequestByTitle(title: string, collection: SpyRequest[]) {
      return collection.find((request) => request?.body?.title === title);
    }

    beforeAll(async () => {
      await changeMockCollection("empty-root");
      await resetRequests();

      cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
        cwd: getFixtureFolder("preprocessors"),
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
          `Converting 1 markdown documents to Confluence pages...`,
        );
      });

      it("should have created 1 pages", async () => {
        expect(createRequests).toHaveLength(1);
      });

      it("should have sent data of page with title foo-parent-title and modified content", async () => {
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
                  <p><strong>AUTOMATION NOTICE: This page is synced automatically, changes made manually will be lost</strong></p><h1>Title modified</h1>
                  <p>This is a paragraph with modified content.</p>
                  `),
              ),
              representation: "storage",
            },
          },
        });

        // @ts-expect-error We don't have typed the structure of the request
        const contentValue = pageRequest?.body?.body?.storage?.value;

        expect(contentValue).toEqual(
          expect.stringContaining(join("preprocessors", "docs", "page.md")),
        );
      });
    });
  });
});
