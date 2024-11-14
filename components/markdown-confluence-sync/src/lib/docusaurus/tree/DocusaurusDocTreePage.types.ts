import type { LoggerInterface } from "@mocks-server/logger";

import type { DocusaurusDocTreeItem } from "./DocusaurusDocTree.types.js";

export interface DocusaurusDocTreePageOptions {
  /** Logger */
  logger?: LoggerInterface;
}

/** Creates DocusaurusDocTreePage interface */
export interface DocusaurusDocTreePageConstructor {
  /** Returns DocusaurusDocTreePage interface
   *
   * @param {string} path - Path to the page
   * @returns {DocusaurusDocTreePage} instance {@link DocusaurusDocTreePageInterface}.
   * @throws {Error} If the path does not exist.
   * @throws {Error} If the path is not a markdown file.
   */
  new (
    path: string,
    options?: DocusaurusDocTreePageOptions,
  ): DocusaurusDocTreePageInterface;
}

/**
 * DocusaurusDocTreePage interface
 *
 * @extends DocusaurusDocTreeItem
 */
export type DocusaurusDocTreePageInterface = DocusaurusDocTreeItem;
