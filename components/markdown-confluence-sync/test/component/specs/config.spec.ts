// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital and contributors
// SPDX-License-Identifier: Apache-2.0

import { ChildProcessManager } from "@tid-xcut/child-process-manager";
import type { ChildProcessManagerInterface } from "@tid-xcut/child-process-manager";

import { cleanLogs } from "../support/Logs";
import {
  getFixtureFolder,
  getBinaryPathFromFixtureFolder,
} from "../support/Paths";

describe("configuration", () => {
  let cli: ChildProcessManagerInterface;

  beforeEach(() => {
    process.env.MARKDOWN_CONFLUENCE_SYNC_LOG_LEVEL = "debug";
    cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
      cwd: getFixtureFolder("basic"),
      silent: true,
    });
  });

  afterEach(async () => {
    await cli.kill();
  });

  describe("when providing config using env vars", () => {
    it("should exit with code 1 when Confluence url is not set", async () => {
      delete process.env.MARKDOWN_CONFLUENCE_SYNC_CONFLUENCE_URL;
      const { exitCode, logs } = await cli.run();

      expect(cleanLogs(logs)).toContain(
        `Error: Confluence URL is required. Please set confluence.url option.`,
      );
      expect(exitCode).toBe(1);
    });
  });

  describe("when providing config using config file", () => {
    it("should exit with code 1 when Confluence url is not set", async () => {
      cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
        cwd: getFixtureFolder("config-file-wrong"),
        silent: true,
      });
      const { exitCode, logs } = await cli.run();

      expect(exitCode).toBe(1);
      expect(cleanLogs(logs)).toContain(
        `Error: /confluence/url: type must be string`,
      );
    });
  });

  describe("when providing config using arguments", () => {
    it("should exit with code 1 when Confluence url is wrongly typed", async () => {
      cli = new ChildProcessManager(
        [
          getBinaryPathFromFixtureFolder(),
          "--confluence.foo-url=https://foo-confluence.com",
        ],
        {
          cwd: getFixtureFolder("basic"),
          silent: true,
        },
      );
      const { exitCode, logs } = await cli.run();

      expect(exitCode).toBe(1);
      expect(cleanLogs(logs)).toContain(
        `error: unknown option '--confluence.foo-url=https://foo-confluence.com'`,
      );
    });

    it("should display a log text when mode is not set", async () => {
      cli = new ChildProcessManager([getBinaryPathFromFixtureFolder()], {
        cwd: getFixtureFolder("basic"),
        silent: true,
      });
      const { exitCode, logs } = await cli.run();

      expect(exitCode).toBe(1);
      expect(cleanLogs(logs)).toContain(`mode option is tree`);
    });

    it("should display a log text when mode is flat", async () => {
      cli = new ChildProcessManager(
        [getBinaryPathFromFixtureFolder(), "--mode=flat"],
        {
          cwd: getFixtureFolder("basic"),
          silent: true,
        },
      );
      const { exitCode, logs } = await cli.run();

      expect(exitCode).toBe(1);
      expect(cleanLogs(logs)).toContain(`mode option is flat`);
    });

    it(`should fail and throw log error when mode isn't valid mode`, async () => {
      cli = new ChildProcessManager(
        [getBinaryPathFromFixtureFolder(), "--mode=foo"],
        {
          cwd: getFixtureFolder("basic"),
          silent: true,
        },
      );
      const { exitCode, logs } = await cli.run();

      expect(exitCode).toBe(1);
      expect(cleanLogs(logs)).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`must be one of "tree" or "flat"`),
        ]),
      );
    });

    it("should fail and throw log error when mode is flat and filesPattern is empty", async () => {
      cli = new ChildProcessManager(
        [getBinaryPathFromFixtureFolder(), "--mode=flat"],
        {
          cwd: getFixtureFolder("basic"),
          silent: true,
        },
      );
      const { exitCode, logs } = await cli.run();

      expect(exitCode).toBe(1);
      expect(cleanLogs(logs)).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`File pattern can't be empty in flat mode`),
        ]),
      );
    });

    it("should fail and throw log error because mode is flat and filesPattern is empty", async () => {
      cli = new ChildProcessManager(
        [getBinaryPathFromFixtureFolder(), "--mode=flat"],
        {
          cwd: getFixtureFolder("basic"),
          silent: true,
        },
      );
      const { exitCode, logs } = await cli.run();

      expect(exitCode).toBe(1);
      expect(cleanLogs(logs)).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`can't be empty in flat mode`),
        ]),
      );
    });

    it("should display a log text when mode is flat and filesPattern not empty", async () => {
      cli = new ChildProcessManager(
        [getBinaryPathFromFixtureFolder(), "--filesPattern=**/index*"],
        {
          cwd: getFixtureFolder("basic"),
          silent: true,
          env: {
            MARKDOWN_CONFLUENCE_SYNC_MODE: "flat",
          },
        },
      );
      const { exitCode, logs } = await cli.run();

      expect(exitCode).toBe(1);

      expect(cleanLogs(logs)).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`matching the pattern`),
        ]),
      );
    });
  });
});
