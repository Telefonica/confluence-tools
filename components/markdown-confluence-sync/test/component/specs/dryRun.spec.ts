// SPDX-FileCopyrightText: 2025 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { ChildProcessManager } from "@telefonica/child-process-manager";
import type { ChildProcessManagerInterface } from "@telefonica/child-process-manager";

import { cleanLogs } from "../support/Logs";
import {
  getFixtureFolder,
  getBinaryPathFromFixtureFolder,
} from "../support/Paths";

describe("dryRun mode", () => {
  let cli: ChildProcessManagerInterface;

  beforeEach(() => {
    process.env.MARKDOWN_CONFLUENCE_SYNC_LOG_LEVEL = "debug";
    cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
      cwd: getFixtureFolder("dry-run"),
      silent: true,
    });
  });

  afterEach(async () => {
    await cli.kill();
  });

  describe("when dryRun option is true", () => {
    it("should exit with code 1 when there are errors in markdown", async () => {
      const { exitCode, logs } = await cli.run();

      const allLogs = cleanLogs(logs).join("\n");

      expect(allLogs).toContain(`Title is required:`);
      expect(allLogs).toContain(`dry-run/docs/foo.md`);
      expect(allLogs).toContain(
        `Please provide it using frontmatter or filesMetadata option`,
      );
      expect(exitCode).toBe(1);
    });

    it("should not call to synchronize", async () => {
      cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
        cwd: getFixtureFolder("mock-server-with-confluence-title"),
        silent: true,
        env: {
          MARKDOWN_CONFLUENCE_SYNC_DRY_RUN: "true",
        },
      });
      const { logs } = await cli.run();

      const allLogs = cleanLogs(logs).join("\n");

      expect(allLogs).toContain(
        `Dry run mode is enabled. No changes will be made to Confluence.`,
      );
    });
  });
});
