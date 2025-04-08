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

describe("markdown-confluence-sync binary with id mode active", () => {
  let cli: ChildProcessManagerInterface;
  let exitCode: number | null;
  let createRequests: SpyRequest[];

  describe("when the options have the option filesPattern and no rootPageId", () => {
    let updateRequest: SpyRequest[];

    beforeAll(async () => {
      await changeMockCollection("with-confluence-page-id");
      await resetRequests();

      cli = new ChildProcessManager(
        [getBinaryPathFromFixtureFolder(), "--filesPattern=**/grandChild2*"],
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

    it("should have updated 1 page with the confluence page identifier given in the file", async () => {
      expect(updateRequest).toHaveLength(1);
    });
  });

  describe("when filesPattern option searches for a txt file", () => {
    beforeAll(async () => {
      await changeMockCollection("with-confluence-page-id");
      await resetRequests();

      cli = new ChildProcessManager(
        [getBinaryPathFromFixtureFolder(), "--filesPattern=**/grandChild1.txt"],
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

      createRequests = await getRequestsByRouteId("confluence-create-page");
    });

    afterAll(async () => {
      await cli.kill();
    });

    it("should have exit code 0", async () => {
      expect(exitCode).toBe(0);
    });

    it("should not have created pages because the file filter is looking for md or mdx files", async () => {
      expect(createRequests).toHaveLength(0);
    });
  });

  describe("when filesPattern option searches files with 'check' pattern", () => {
    beforeAll(async () => {
      await changeMockCollection("with-confluence-page-id");
      await resetRequests();

      cli = new ChildProcessManager(
        [getBinaryPathFromFixtureFolder(), "--filesPattern=**/check*"],
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

      createRequests = await getRequestsByRouteId("confluence-create-page");
    });

    afterAll(async () => {
      await cli.kill();
    });

    it("should have exit code 0", async () => {
      expect(exitCode).toBe(0);
    });

    it("should not have created pages because files not matches pattern", async () => {
      expect(createRequests).toHaveLength(0);
    });
  });
});
