// SPDX-FileCopyrightText: 2025 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { ChildProcessManagerInterface } from "@telefonica/child-process-manager";
import { ChildProcessManager } from "@telefonica/child-process-manager";

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

describe("ignore option", () => {
  let cli: ChildProcessManagerInterface;
  let exitCode: number | null;
  let createRequests: SpyRequest[];

  describe("in id mode", () => {
    let updateRequest: SpyRequest[];

    beforeAll(async () => {
      await changeMockCollection("with-confluence-page-id");
      await resetRequests();

      cli = new ChildProcessManager(
        [
          getBinaryPathFromFixtureFolder(),
          "--filesPattern=**/child1/**",
          "--ignore=**/child1/**",
        ],
        {
          cwd: getFixtureFolder("mock-server-with-confluence-page-id"),
          silent: true,
          env: {
            MARKDOWN_CONFLUENCE_SYNC_LOG_LEVEL: "debug",
            MARKDOWN_CONFLUENCE_SYNC_MODE: "id",
          },
        },
      );

      const result = await cli.run();
      exitCode = result.exitCode;
      updateRequest = await getRequestsByRouteId("confluence-update-page");
    });

    afterAll(async () => {
      await cli.kill();
    });

    it("should have exit code 0", async () => {
      expect(exitCode).toBe(0);
    });

    it("should have updated 0 pages", async () => {
      expect(updateRequest).toHaveLength(0);
    });
  });

  describe("in tree mode", () => {
    beforeAll(async () => {
      await changeMockCollection("empty-root");
      await resetRequests();

      cli = new ChildProcessManager(
        [
          getBinaryPathFromFixtureFolder(),
          "--ignore",
          "**/child5/**",
          "docs/parent/child1/grandChild2.md",
          "docs/parent/child4/**",
          "docs/parent/child3/grandChild5.md",
        ],
        {
          cwd: getFixtureFolder("mock-server-empty-root"),
          silent: true,
          env: {
            MARKDOWN_CONFLUENCE_SYNC_LOG_LEVEL: "debug",
          },
        },
      );

      const result = await cli.run();
      exitCode = result.exitCode;

      createRequests = await getRequestsByRouteId("confluence-create-page");
    });

    afterAll(async () => {
      await cli.kill();
    });

    it("should have exit code 0", async () => {
      expect(exitCode).toBe(0);
    });

    it("should have created 11 pages", async () => {
      expect(createRequests).toHaveLength(11);
    });
  });
});
