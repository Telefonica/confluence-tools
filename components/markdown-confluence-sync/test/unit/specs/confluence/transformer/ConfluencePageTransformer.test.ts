// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { join, resolve } from "path";

import type { ConfluenceInputPage } from "@telefonica/confluence-sync";
import { glob } from "glob";
import rehypeStringify from "rehype-stringify/lib";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype/lib";
import type { DirResult } from "tmp";
import * as toVFile from "to-vfile";
import { dedent } from "ts-dedent";

import { TempFiles } from "@support/utils/TempFiles";
const { dirSync } = new TempFiles();

import { ConfluencePageTransformer } from "@src/lib/confluence/transformer/ConfluencePageTransformer";
import type { ConfluencePageTransformerInterface } from "@src/lib/confluence/transformer/ConfluencePageTransformer.types";
import { InvalidTemplateError } from "@src/lib/confluence/transformer/errors/InvalidTemplateError";

import type { ConfluenceSyncPage } from "../../../../../src";

jest.mock<typeof import("to-vfile")>("to-vfile", () => {
  return {
    __esModule: true,
    ...jest.requireActual("to-vfile"),
  };
});

describe("confluencePageTransformer", () => {
  let transformer: ConfluencePageTransformerInterface;

  beforeEach(() => {
    transformer = new ConfluencePageTransformer({
      spaceKey: "space-key",
      rehype: { codeBlocks: true },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(ConfluencePageTransformer).toBeDefined();
  });

  it("should throw error if transform fails", async () => {
    // Arrange
    jest.spyOn(toVFile, "toVFile").mockImplementationOnce(() => {
      throw new Error("Error");
    });
    const pages = [
      {
        path: join(__dirname, "./page-1.md"),
        content: 0,
        ancestors: [],
        title: "Page 1",
      },
    ];

    // Act & Assert
    // @ts-expect-error Transform method should throw an error with invalid content
    await expect(transformer.transform(pages)).rejects.toThrow();
  });

  it("should transform pages", async () => {
    // Arrange
    const pages = [
      {
        title: "Page 1",
        path: join(__dirname, "./page-1.md"),
        relativePath: "./page-1.md",
        content: "Page 1 content",
        ancestors: [],
      },
      {
        title: "Page 2",
        path: join(__dirname, "./page-2.md"),
        relativePath: "./page-2.md",
        content: "Page 2 content",
        ancestors: [],
      },
    ];

    // Act
    const transformedPages = await transformer.transform(pages);

    // Assert
    expect(transformedPages).toEqual([
      {
        title: "Page 1",
        ancestors: [],
        content: expect.stringContaining("<p>Page 1 content</p>"),
        attachments: {},
      },
      {
        title: "Page 2",
        ancestors: [],
        content: expect.stringContaining("<p>Page 2 content</p>"),
        attachments: {},
      },
    ]);
  });

  it("should transform pages with internal references", async () => {
    // Arrange
    const pages = [
      {
        title: "Page 1",
        path: join(__dirname, "./page-1.md"),
        relativePath: "./page-1.md",
        content: "Page 1 content",
        ancestors: [],
      },
      {
        title: "Page 2",
        path: join(__dirname, "./page-2.md"),
        relativePath: "./page-2.md",
        content: "[Page 1](./page-1.md)",
        ancestors: [],
      },
    ];

    // Act
    const transformedPages = await transformer.transform(pages);

    // Assert
    expect(transformedPages).toEqual([
      {
        title: "Page 1",
        ancestors: [],
        content: expect.stringContaining("<p>Page 1 content</p>"),
        attachments: {},
      },
      {
        title: "Page 2",
        ancestors: [],
        content: expect.stringContaining(
          '<p><ac:link><ri:page ri:content-title="Page 1" ri:space-key="space-key"></ri:page><ac:plain-text-link-body><![CDATA[Page 1]]></ac:plain-text-link-body></ac:link></p>',
        ),
        attachments: {},
      },
    ]);
  });

  it("should transform pages with internal references and strikethrough", async () => {
    // Arrange
    const pages = [
      {
        title: "Page 1",
        path: join(__dirname, "./page-1.md"),
        relativePath: "./page-1.md",
        content: "~~strikethrough~~",
        ancestors: [],
      },
    ];

    // Act
    const transformedPages = await transformer.transform(pages);

    // Assert
    expect(transformedPages).toEqual([
      {
        title: "Page 1",
        ancestors: [],
        content: expect.stringContaining(
          '<p><span style="text-decoration: line-through;">strikethrough</span></p>',
        ),
        attachments: {},
      },
    ]);
  });

  it("should support images", async () => {
    // Arrange
    const pages = [
      {
        title: "Page 1",
        path: join(__dirname, "./page-1.md"),
        relativePath: "./page-1.md",
        content: dedent`
        # Hello world

        ![image](./image.png)
        `,
        ancestors: [],
      },
    ];

    // Act
    const transformedPages = await transformer.transform(pages);

    // Assert
    expect(transformedPages).toEqual([
      {
        title: "Page 1",
        ancestors: [],
        content: expect.stringContaining(
          '<ac:image><ri:attachment ri:filename="image.png"></ri:attachment></ac:image>',
        ),
        attachments: expect.objectContaining({
          "image.png": expect.stringContaining("image.png"),
        }),
      },
    ]);
  });

  describe("transform page title", () => {
    it("should transform page title with parents title", async () => {
      // Arrange
      const pages = [
        {
          title: "Parent 1",
          path: join(__dirname, "./parent/index.md"),
          relativePath: "./parent/index.md",
          content: "Parent 1 content",
          ancestors: [],
        },
        {
          title: "Page 1",
          path: join(__dirname, "./parent/page-1/index.md"),
          relativePath: "./parent/page-1/index.md",
          content: "Page 1 content",
          ancestors: [join(__dirname, "./parent/index.md")],
        },
        {
          title: "Child 1",
          path: join(__dirname, "./parent/page-1/child-1.md"),
          relativePath: "./parent/page-1/child-1.md",
          content: "Child 1 content",
          ancestors: [
            join(__dirname, "./parent/index.md"),
            join(__dirname, "./parent/page-1/index.md"),
          ],
        },
      ];

      // Act
      const transformedPages = await transformer.transform(pages);

      // Assert
      expect(transformedPages).toEqual([
        {
          title: "Parent 1",
          ancestors: [],
          content: expect.stringContaining("<p>Parent 1 content</p>"),
          attachments: {},
        },
        {
          title: "[Parent 1] Page 1",
          ancestors: ["Parent 1"],
          content: expect.stringContaining("<p>Page 1 content</p>"),
          attachments: {},
        },
        {
          title: "[Parent 1][Page 1] Child 1",
          ancestors: ["Parent 1", "[Parent 1] Page 1"],
          content: expect.stringContaining("<p>Child 1 content</p>"),
          attachments: {},
        },
      ]);
    });

    it("should propagate parent name to children title", async () => {
      // Arrange
      const pages = [
        {
          title: "Parent 1",
          path: join(__dirname, "./parent/index.md"),
          relativePath: "./parent/index.md",
          content: "Parent 1 content",
          ancestors: [],
          name: "Root",
        },
        {
          title: "Title Page 1",
          path: join(__dirname, "./parent/page-1/index.md"),
          relativePath: "./parent/page-1/index.md",
          content: "Page 1 content",
          ancestors: [join(__dirname, "./parent/index.md")],
          name: "Page 1",
        },
        {
          title: "Child 1",
          path: join(__dirname, "./parent/page-1/child-1.md"),
          relativePath: "./parent/page-1/child-1.md",
          content: "Child 1 content",
          ancestors: [
            join(__dirname, "./parent/index.md"),
            join(__dirname, "./parent/page-1/index.md"),
          ],
        },
      ];

      // Act
      const transformedPages = await transformer.transform(pages);

      // Assert
      expect(transformedPages).toEqual([
        {
          title: "Parent 1",
          ancestors: [],
          content: expect.stringContaining("<p>Parent 1 content</p>"),
          attachments: {},
        },
        {
          title: "[Root] Title Page 1",
          ancestors: ["Parent 1"],
          content: expect.stringContaining("<p>Page 1 content</p>"),
          attachments: {},
        },
        {
          title: "[Root][Page 1] Child 1",
          ancestors: ["Parent 1", "[Root] Title Page 1"],
          content: expect.stringContaining("<p>Child 1 content</p>"),
          attachments: {},
        },
      ]);
    });
  });

  it("should add root page name to children title", async () => {
    // Arrange
    const transformerWithRootPageName = new ConfluencePageTransformer({
      rootPageName: "Root",
      spaceKey: "space-key",
      rehype: { codeBlocks: true },
    });
    const pages = [
      {
        title: "Page 1",
        path: join(__dirname, "./page-1.md"),
        relativePath: "./page-1.md",
        content: "Page 1 content",
        ancestors: [],
      },
      {
        title: "Child 1",
        path: join(__dirname, "./page-1/child-1.md"),
        relativePath: "./page-1/child-1.md",
        content: "Child 1 content",
        ancestors: [join(__dirname, "./page-1.md")],
      },
    ];

    // Act
    const transformedPages = await transformerWithRootPageName.transform(pages);

    // Assert
    expect(transformedPages).toEqual([
      {
        title: "[Root] Page 1",
        ancestors: [],
        content: expect.stringContaining("<p>Page 1 content</p>"),
        attachments: {},
      },
      {
        title: "[Root][Page 1] Child 1",
        ancestors: ["[Root] Page 1"],
        content: expect.stringContaining("<p>Child 1 content</p>"),
        attachments: {},
      },
    ]);
  });

  describe("notice message", () => {
    it("should add default notice message to page content", async () => {
      // Arrange
      const pages = [
        {
          title: "Page 1",
          path: join(__dirname, "./page-1.md"),
          relativePath: "./page-1.md",
          content: "Page 1 content",
          ancestors: [],
        },
      ];
      const transformerWithDefaultNoticeMessage = new ConfluencePageTransformer(
        {
          spaceKey: "space-key",
          rehype: { codeBlocks: true },
        },
      );

      // Act
      const transformedPages =
        await transformerWithDefaultNoticeMessage.transform(pages);

      // Assert
      expect(transformedPages).toEqual([
        {
          title: "Page 1",
          ancestors: [],
          attachments: {},
          content: expect.stringContaining(
            "<p><strong>AUTOMATION NOTICE: This page is synced automatically, changes made manually will be lost</strong></p>",
          ),
        },
      ]);
    });

    it("should add notice message to page content", async () => {
      // Arrange
      const pages = [
        {
          title: "Page 1",
          path: join(__dirname, "./page-1.md"),
          relativePath: "./page-1.md",
          content: "Page 1 content",
          ancestors: [],
        },
      ];
      const noticeMessage =
        "This page was generated from a markdown file. Do not edit it directly.";
      const transformerWithNoticeMessage = new ConfluencePageTransformer({
        noticeMessage,
        spaceKey: "space-key",
        rehype: { codeBlocks: true },
      });

      // Act
      const transformedPages =
        await transformerWithNoticeMessage.transform(pages);

      // Assert
      expect(transformedPages).toEqual([
        {
          title: "Page 1",
          ancestors: [],
          attachments: {},
          content: expect.stringContaining(
            "<p><strong>This page was generated from a markdown file. Do not edit it directly.</strong></p>",
          ),
        },
      ]);
    });

    it("should throw error if notice template is invalid", async () => {
      // Arrange
      const pages = [
        {
          title: "Page 1",
          path: join(__dirname, "./page-1.md"),
          relativePath: "./page-1.md",
          content: "Page 1 content",
          ancestors: [],
        },
      ];
      const transformerWithNoticeMessage = new ConfluencePageTransformer({
        noticeTemplate: "{{relativePath}",
        spaceKey: "space-key",
        rehype: { codeBlocks: true },
      });

      // Act
      // Assert
      await expect(() =>
        transformerWithNoticeMessage.transform(pages),
      ).rejects.toThrow(InvalidTemplateError);
    });

    it("should render notice template to page content", async () => {
      // Arrange
      const pages = [
        {
          title: "Page 1",
          path: join(__dirname, "./page-1.md"),
          relativePath: "./page-1.md",
          content: "Page 1 content",
          ancestors: [],
        },
      ];
      const noticeTemplate = `Better visit https://foo/{{relativePathWithoutExtension}}. This page was generated from {{relativePath}} with title {{title}}. {{default}}`;
      const transformerWithNoticeTemplate = new ConfluencePageTransformer({
        noticeTemplate,
        spaceKey: "space-key",
        rehype: { codeBlocks: true },
      });

      // Act
      const transformedPages =
        await transformerWithNoticeTemplate.transform(pages);

      // Assert
      expect(transformedPages).toEqual([
        {
          title: "Page 1",
          ancestors: [],
          attachments: {},
          content: expect.stringContaining(
            "<p><strong>Better visit https://foo/./page-1. This page was generated from ./page-1.md with title Page 1. AUTOMATION NOTICE: This page is synced automatically, changes made manually will be lost</strong></p>",
          ),
        },
      ]);
    });

    it("should render notice template with notice message to page content", async () => {
      // Arrange
      const pages = [
        {
          title: "Page 1",
          path: join(__dirname, "./page-1.md"),
          relativePath: "./page-1.md",
          content: "Page 1 content",
          ancestors: [],
        },
      ];
      const noticeTemplate = `This page was generated from {{relativePath}} with title {{title}}. {{message}}`;
      const noticeMessage = "Do not edit it directly.";
      const transformerWithNoticeTemplate = new ConfluencePageTransformer({
        noticeTemplate,
        noticeMessage,
        spaceKey: "space-key",
        rehype: { codeBlocks: true },
      });

      // Act
      const transformedPages =
        await transformerWithNoticeTemplate.transform(pages);

      // Assert
      expect(transformedPages).toEqual([
        {
          title: "Page 1",
          ancestors: [],
          attachments: {},
          content: expect.stringContaining(
            "<p><strong>This page was generated from ./page-1.md with title Page 1. Do not edit it directly.</strong></p>",
          ),
        },
      ]);
    });
  });

  describe("mermaid code blocks", () => {
    let tmpDir: DirResult;
    let mermaidCodeBlock: string;
    let pages: ConfluenceSyncPage[];
    let transformedPages: ConfluenceInputPage[];
    let expectedMermaidCodeBlock: string;

    beforeEach(async () => {
      tmpDir = dirSync({ unsafeCleanup: true });
      mermaidCodeBlock = dedent`\`\`\`mermaid
                          graph LR
                            Start --> Stop
                          \`\`\`
                          `;
      expectedMermaidCodeBlock = remark()
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(mermaidCodeBlock)
        .toString();
      pages = [
        {
          title: "Page 1",
          path: join(tmpDir.name, "./page-1.md"),
          relativePath: "./page-1.md",
          content: mermaidCodeBlock,
          ancestors: [],
        },
      ];
      transformedPages = await transformer.transform(pages);
    });

    // FIXME: This test should throw error.
    //  It changes due to lack of time to debug possible issues with mermaid cli.
    it("should throw error if mermaid code block is invalid", async () => {
      // Arrange
      const invalidPages = [
        {
          title: "Page 1",
          path: join(tmpDir.name, "./page-1.md"),
          relativePath: "./page-1.md",
          content: "```mermaid\ninvalid mermaid code block\n```",
          ancestors: [],
        },
      ];

      // Act
      // Assert
      await expect(transformer.transform(invalidPages)).resolves.not.toThrow();
    });

    // TODO: Enable this test when mermaid deps are fixed in the runners CI
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("should remove mermaid code block", async () => {
      // Arrange
      // Act
      // Assert
      expect(transformedPages[0].content).not.toContain(
        expectedMermaidCodeBlock,
      );
    });

    // TODO: Enable this test when mermaid deps are fixed in the runners CI
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("should create mermaid svg diagram in file path", async () => {
      // Arrange
      // Act
      // Assert
      const autogeneratedImages = await glob("autogenerated-*.svg", {
        cwd: resolve(tmpDir.name, "mermaid-diagrams"),
      });

      expect(autogeneratedImages).toHaveLength(1);

      const autogeneratedSvg = autogeneratedImages[0];

      expect(autogeneratedSvg).toBeDefined();
    });

    // TODO: Enable this test when images are enabled <t:1257>
    it.todo("should add image link to page content");
  });

  describe("details blocks", () => {
    it("should replace a details tag", async () => {
      // Arrange
      const pages = [
        {
          title: "Page 1",
          path: join(__dirname, "./page-1.md"),
          relativePath: "./page-1.md",
          content: dedent`
            <details><summary>Summary</summary>Details</details>
          `,
          ancestors: [],
        },
      ];

      // Act
      const transformedPages = await transformer.transform(pages);

      // Assert
      expect(transformedPages).toEqual([
        {
          title: "Page 1",
          ancestors: [],
          content: expect.stringContaining(
            '<ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">Summary</ac:parameter><ac:rich-text-body><p>Details</p></ac:rich-text-body></ac:structured-macro>',
          ),
          attachments: {},
        },
      ]);
    });

    it("should throw error if details tag is missing summary", async () => {
      // Arrange
      const pages = [
        {
          title: "Page 1",
          path: join(__dirname, "./page-1.md"),
          relativePath: "./page-1.md",
          content: "<details>Details</details>",
          ancestors: [],
        },
      ];

      // Act
      // Assert
      await expect(transformer.transform(pages)).rejects.toThrow();
    });

    it("should replace nested details tags", async () => {
      // Arrange
      const pages = [
        {
          title: "Page 1",
          path: join(__dirname, "./page-1.md"),
          relativePath: "./page-1.md",
          content: dedent`
            <details>
              <summary>Summary</summary>
              <details><summary>Summary 2</summary>Details 2</details>
            </details>
          `,
          ancestors: [],
        },
      ];

      // Act
      const transformedPages = await transformer.transform(pages);

      // Assert
      expect(transformedPages).toEqual([
        {
          title: "Page 1",
          ancestors: [],
          content: expect.stringContaining(
            '<ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">Summary</ac:parameter><ac:rich-text-body><ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">Summary 2</ac:parameter><ac:rich-text-body><p>Details 2</p></ac:rich-text-body></ac:structured-macro></ac:rich-text-body></ac:structured-macro>',
          ),
          attachments: {},
        },
      ]);
    });

    it("should do nothing to other tags inside a details tag", async () => {
      // Arrange
      const pages = [
        {
          title: "Page 1",
          path: join(__dirname, "./page-1.md"),
          relativePath: "./page-1.md",
          content: dedent`
            <details>
              <summary>Summary</summary>
              <p>paragraph</p>
            </details>
          `,
          ancestors: [],
        },
      ];

      // Act
      const transformedPages = await transformer.transform(pages);

      // Assert
      expect(transformedPages).toEqual([
        {
          title: "Page 1",
          ancestors: [],
          content: expect.stringContaining(
            '<ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">Summary</ac:parameter><ac:rich-text-body><p>paragraph</p></ac:rich-text-body></ac:structured-macro>',
          ),
          attachments: {},
        },
      ]);
    });
  });
});
