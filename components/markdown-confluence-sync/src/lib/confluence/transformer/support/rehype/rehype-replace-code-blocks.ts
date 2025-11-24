// SPDX-FileCopyrightText: 2025 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { Element as HastElement, Root, Text as HastText } from "hast";
import type { Plugin as UnifiedPlugin } from "unified";

import { replace } from "../../../../support/unist/unist-util-replace.js";

/**
 * UnifiedPlugin to replace `<pre><code>` HastElements with Confluence's
 * structured code macro format.
 *
 * @see {@link https://developer.atlassian.com/server/confluence/confluence-storage-format/ | Confluence Storage Format }
 *
 * @example
 *  <pre><code class="language-javascript">const x = 42;</code></pre>
 *  // becomes
 *  <ac:structured-macro ac:name="code">
 *    <ac:parameter ac:name="language">javascript</ac:parameter>
 *    <ac:plain-text-body><![CDATA[const x = 42;]]></ac:plain-text-body>
 *  </ac:structured-macro>
 */
const rehypeReplaceCodeBlocks: UnifiedPlugin<[], Root> =
  function rehypeReplaceCodeBlocks() {
    return function transformer(tree) {
      replace(tree, { type: "element", tagName: "pre" }, (node) => {
        // Check if this pre element contains a code element
        const codeElement = node.children.find(
          (child) =>
            child.type === "element" &&
            (child as HastElement).tagName === "code",
        ) as HastElement | undefined;

        if (!codeElement) {
          // If there's no code element, return the pre element unchanged
          return node;
        }

        // Extract the language from the code element's className
        const language = extractLanguage(codeElement);

        // Extract the text content from the code element
        const codeContent = extractTextContent(codeElement);

        // Build the Confluence code macro
        const macroChildren: HastElement[] = [];

        // Add language parameter if present
        if (language) {
          macroChildren.push({
            type: "element" as const,
            tagName: "ac:parameter",
            properties: {
              "ac:name": "language",
            },
            children: [
              {
                type: "raw" as const,
                value: language,
              },
            ],
          });
        }

        // Add the code content
        // Note: We use a text node with the raw CDATA markup
        // The rehypeStringify with allowDangerousHtml will preserve it
        macroChildren.push({
          type: "element" as const,
          tagName: "ac:plain-text-body",
          properties: {},
          children: [
            {
              type: "raw" as const,
              value: `<![CDATA[${codeContent}]]>`,
            },
          ],
        });

        return {
          type: "element" as const,
          tagName: "ac:structured-macro",
          properties: {
            "ac:name": "code",
          },
          children: macroChildren,
        };
      });
    };
  };

/**
 * Extract the language from the code element's className property.
 * Markdown renderers typically add classes like "language-javascript"
 * to code elements.
 *
 * @param codeElement - The code element to extract the language from
 * @returns The language identifier or undefined if not found
 */
function extractLanguage(codeElement: HastElement): string | undefined {
  const className = codeElement.properties?.className;

  if (!className) {
    return undefined;
  }

  // className is always an array of strings, but we check it for safety
  // istanbul ignore next
  const classNames = Array.isArray(className) ? className : [className];

  // Look for a class that starts with "language-"
  for (const cls of classNames) {
    if (typeof cls === "string" && cls.startsWith("language-")) {
      return cls.substring(9); // Remove "language-" prefix
    }
  }

  return undefined;
}

/**
 * Extract all text content from an element recursively.
 *
 * @param element - The element to extract text from
 * @returns The concatenated text content
 */
function extractTextContent(element: HastElement): string {
  let text = "";

  for (const child of element.children) {
    if (child.type === "text") {
      text += (child as HastText).value;
    } else if (child.type === "element") {
      text += extractTextContent(child as HastElement);
    }
  }

  return text;
}

export default rehypeReplaceCodeBlocks;
