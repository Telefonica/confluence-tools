// SPDX-FileCopyrightText: 2025 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import rehypeParse from "rehype-parse";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

import rehypeReplaceAlerts from "@src/lib/confluence/transformer/support/rehype/rehype-replace-alerts";

describe("rehype-replace-alerts", () => {
  it("should be defined", () => {
    expect(rehypeReplaceAlerts).toBeDefined();
  });

  it("should replace [!NOTE] alert to Confluence info macro", () => {
    // Arrange
    const html = `<blockquote>
<p>[!NOTE]
This is a note</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="info">');
    expect(result).toContain('<ac:parameter ac:name="title">Note');
    expect(result).toContain("<ac:rich-text-body>");
    expect(result).toContain("This is a note");
  });

  it("should replace [!TIP] alert to Confluence tip macro", () => {
    // Arrange
    const html = `<blockquote>
<p>[!TIP]
This is a helpful tip</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="tip">');
    expect(result).toContain('<ac:parameter ac:name="title">Tip');
    expect(result).toContain("<ac:rich-text-body>");
    expect(result).toContain("This is a helpful tip");
  });

  it("should replace [!IMPORTANT] alert to Confluence note macro", () => {
    // Arrange
    const html = `<blockquote>
<p>[!IMPORTANT]
This is important information</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="note">');
    expect(result).toContain('<ac:parameter ac:name="title">Important');
    expect(result).toContain("<ac:rich-text-body>");
    expect(result).toContain("This is important information");
  });

  it("should replace [!WARNING] alert to Confluence warning macro", () => {
    // Arrange
    const html = `<blockquote>
<p>[!WARNING]
This is a warning</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="warning">');
    expect(result).toContain('<ac:parameter ac:name="title">Warning');
    expect(result).toContain("<ac:rich-text-body>");
    expect(result).toContain("This is a warning");
  });

  it("should replace [!CAUTION] alert to Confluence warning macro", () => {
    // Arrange
    const html = `<blockquote>
<p>[!CAUTION]
This is a caution</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="warning">');
    expect(result).toContain('<ac:parameter ac:name="title">Caution');
    expect(result).toContain("<ac:rich-text-body>");
    expect(result).toContain("This is a caution");
  });

  it("should handle alert with multiple paragraphs", () => {
    // Arrange
    const html = `<blockquote>
<p>[!NOTE]
First paragraph</p>
<p>Second paragraph</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="info">');
    expect(result).toContain("First paragraph");
    expect(result).toContain("Second paragraph");
  });

  it("should not transform regular blockquotes", () => {
    // Arrange
    const html = `<blockquote>
<p>This is a regular blockquote</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).not.toContain('<ac:structured-macro ac:name="info">');
    expect(result).toContain("<blockquote>");
    expect(result).toContain("This is a regular blockquote");
  });

  it("should not transform blockquote without paragraph", () => {
    // Arrange
    const html = `<blockquote>
Just text
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).not.toContain('<ac:structured-macro ac:name="info">');
    expect(result).toContain("<blockquote>");
  });

  it("should handle alert with only marker (no additional text)", () => {
    // Arrange
    const html = `<blockquote>
<p>[!NOTE]</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="info">');
    expect(result).toContain('<ac:parameter ac:name="title">Note');
  });

  it("should handle alert with formatted content", () => {
    // Arrange
    const html = `<blockquote>
<p>[!NOTE]
This has <strong>bold</strong> and <em>italic</em> text</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="info">');
    expect(result).toContain("<strong>bold</strong>");
    expect(result).toContain("<em>italic</em>");
  });

  it("should handle alert with code in content", () => {
    // Arrange
    const html = `<blockquote>
<p>[!TIP]
Use <code>npm install</code> to install packages</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="tip">');
    expect(result).toContain("<code>npm install</code>");
  });

  it("should handle alert with list in content", () => {
    // Arrange
    const html = `<blockquote>
<p>[!WARNING]
Important steps:</p>
<ul>
<li>Step 1</li>
<li>Step 2</li>
</ul>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="warning">');
    expect(result).toContain("Important steps:");
    expect(result).toContain("<ul>");
    expect(result).toContain("Step 1");
    expect(result).toContain("Step 2");
  });

  it("should not transform blockquote with alert marker not at start", () => {
    // Arrange
    const html = `<blockquote>
<p>This is not an alert [!NOTE]</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).not.toContain('<ac:structured-macro ac:name="info">');
    expect(result).toContain("<blockquote>");
  });

  it("should handle empty blockquote", () => {
    // Arrange
    const html = `<blockquote></blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).not.toContain('<ac:structured-macro ac:name="info">');
  });

  it("should handle multiple different alerts", () => {
    // Arrange
    const html = `<blockquote>
<p>[!NOTE]
First note</p>
</blockquote>
<blockquote>
<p>[!WARNING]
Then a warning</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="info">');
    expect(result).toContain('<ac:structured-macro ac:name="warning">');
    expect(result).toContain("First note");
    expect(result).toContain("Then a warning");
  });

  it("should not transform other elements", () => {
    // Arrange
    const html = `<p>paragraph</p><div>division</div>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).not.toContain('<ac:structured-macro ac:name="info">');
    expect(result).toContain("<p>paragraph</p>");
    expect(result).toContain("<div>division</div>");
  });

  it("should handle alert with text immediately after marker", () => {
    // Arrange
    const html = `<blockquote>
<p>[!NOTE]Immediate text</p>
</blockquote>`;

    // Act
    const result = unified()
      .use(rehypeParse)
      .use(rehypeRaw)
      .use(rehypeReplaceAlerts)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        tightSelfClosing: true,
      })
      .processSync(html)
      .toString();

    // Assert
    expect(result).toContain('<ac:structured-macro ac:name="info">');
    expect(result).toContain("Immediate text");
  });
});
