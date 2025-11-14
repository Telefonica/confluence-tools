// SPDX-FileCopyrightText: 2025 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import rehypeParse from "rehype-parse";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

import rehypeReplaceCodeBlocks from "@src/lib/confluence/transformer/support/rehype/rehype-replace-code-blocks";

describe("rehype-replace-code-blocks", () => {
  it("should be defined", () => {
    expect(rehypeReplaceCodeBlocks).toBeDefined();
  });

  it("should replace code block with language to Confluence code macro", () => {
    // Arrange
    const html =
      '<pre><code class="language-javascript">const x = 42;</code></pre>';

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceCodeBlocks)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="code">');
    expect(result).toContain('<ac:parameter ac:name="language">');
    expect(result).toContain("javascript");
    expect(result).toContain("<ac:plain-text-body>");
    expect(result).toContain("&#x3C;![CDATA[const x = 42;]]>");
  });

  it("should replace code block without language to Confluence code macro", () => {
    // Arrange
    const html = "<pre><code>plain text code</code></pre>";

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceCodeBlocks)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="code">');
    expect(result).not.toContain('<ac:parameter ac:name="language">');
    expect(result).toContain("<ac:plain-text-body>");
    expect(result).toContain("&#x3C;![CDATA[plain text code]]>");
  });

  it("should handle different programming languages", () => {
    // Arrange
    const languages = ["python", "java", "typescript", "bash", "sql"];

    for (const lang of languages) {
      const html = `<pre><code class="language-${lang}">code here</code></pre>`;

      // Act
      const result = unified()
        .use(rehypeParse)
        .use(rehypeStringify)
        .use(rehypeReplaceCodeBlocks)
        .processSync(html)
        .toString();

      // Assert
      expect(result).toContain('<ac:structured-macro ac:name="code">');
      expect(result).toContain(`<ac:parameter ac:name="language">${lang}`);
      expect(result).toContain("&#x3C;![CDATA[code here]]>");
    }
  });

  it("should handle code with special characters", () => {
    // Arrange
    const html =
      '<pre><code class="language-javascript">const str = "Hello <World> & \'Friends\'";</code></pre>';

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceCodeBlocks)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="code">');
    expect(result).toContain(
      "&#x3C;![CDATA[const str = \"Hello  &#x26; 'Friends'\";]]>",
    );
  });

  it("should handle multi-line code blocks", () => {
    // Arrange
    const html = `<pre><code class="language-javascript">function test() {
  return true;
}</code></pre>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceCodeBlocks)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="code">');
    expect(result).toContain("function test()");
    expect(result).toContain("return true;");
  });

  it("should not transform pre elements without code children", () => {
    // Arrange
    const html = "<pre>just text</pre>";

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceCodeBlocks)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).not.toContain('<ac:structured-macro ac:name="code">');
    expect(result).toContain("<pre>just text</pre>");
  });

  it("should not transform other elements", () => {
    // Arrange
    const html = "<p>paragraph</p><div>division</div>";

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceCodeBlocks)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).not.toContain('<ac:structured-macro ac:name="code">');
    expect(result).toContain("<p>paragraph</p>");
    expect(result).toContain("<div>division</div>");
  });

  it("should handle code blocks with empty content", () => {
    // Arrange
    const html = '<pre><code class="language-javascript"></code></pre>';

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceCodeBlocks)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="code">');
    expect(result).toContain("<ac:plain-text-body>&#x3C;![CDATA[]]>");
  });

  it("should handle code blocks with multiple class names", () => {
    // Arrange
    const html =
      '<pre><code class="language-typescript highlight-line">const x = 42;</code></pre>';

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceCodeBlocks)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="code">');
    expect(result).toContain('<ac:parameter ac:name="language">typescript');
    expect(result).toContain("&#x3C;![CDATA[const x = 42;]]>");
  });
});
