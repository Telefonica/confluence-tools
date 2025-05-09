// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import remarkParseFrontmatter from "remark-parse-frontmatter";
import remarkStringify from "remark-stringify";
import { dedent } from "ts-dedent";
import { unified } from "unified";
import { VFile } from "vfile";

import remarkValidateFrontmatter from "@src/lib/docusaurus/pages/support/remark/remark-validate-frontmatter";
import { FrontMatterValidator } from "@src/lib/docusaurus/pages/support/validators/FrontMatterValidator";

describe("remark-validate-frontmatter", () => {
  it("should be defined", () => {
    expect(remarkValidateFrontmatter).toBeDefined();
  });

  it("should not fail if the file does not have FrontMatter data", () => {
    // Arrange
    const invalidMarkdown = dedent`
      ---
      ---

      # My Title
      `;

    // Act
    // Assert
    expect(() =>
      unified()
        .use(remarkParse)
        .use(remarkStringify)
        .use(remarkFrontmatter)
        .use(remarkParseFrontmatter)
        .use(remarkValidateFrontmatter, FrontMatterValidator)
        .processSync(new VFile(invalidMarkdown)),
    ).not.toThrow();
  });

  it("should fail if it has frontmatter data and does not include a FrontMatter validation", () => {
    // Arrange
    const invalidMarkdown = dedent`
      ---
      title: My Title
      ---

      # My Title
      `;

    // Act
    // Assert
    expect(() =>
      unified()
        .use(remarkParse)
        .use(remarkStringify)
        .use(remarkFrontmatter)
        .use(remarkParseFrontmatter)
        .use(remarkValidateFrontmatter)
        .processSync(new VFile(invalidMarkdown)),
    ).toThrow();
  });

  it("should process if the file success FrontMatter validation", () => {
    // Arrange
    const invalidMarkdown = dedent`
      ---
      title: My Title
      ---
      
      # My Title
      `;

    // Act
    // Assert
    expect(() =>
      unified()
        .use(remarkParse)
        .use(remarkStringify)
        .use(remarkFrontmatter)
        .use(remarkParseFrontmatter)
        .use(remarkValidateFrontmatter, FrontMatterValidator)
        .processSync(new VFile(invalidMarkdown)),
    ).not.toThrow();
  });
});
