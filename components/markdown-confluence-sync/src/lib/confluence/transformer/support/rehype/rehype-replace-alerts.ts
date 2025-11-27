// SPDX-FileCopyrightText: 2025 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { Element as HastElement, Root, Text as HastText } from "hast";
import type { Plugin as UnifiedPlugin } from "unified";

import { replace } from "../../../../support/unist/unist-util-replace.js";

/**
 * Alert type mapping for GitHub-flavored markdown alerts
 */
type AlertType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

/**
 * Confluence macro names for different alert types
 */
const ALERT_TO_MACRO: Record<AlertType, string> = {
  NOTE: "info",
  TIP: "tip",
  IMPORTANT: "note",
  WARNING: "warning",
  CAUTION: "warning",
};

/**
 * Default titles for alert types
 */
const ALERT_TITLES: Record<AlertType, string> = {
  NOTE: "Note",
  TIP: "Tip",
  IMPORTANT: "Important",
  WARNING: "Warning",
  CAUTION: "Caution",
};

/**
 * UnifiedPlugin to replace GitHub alert blockquotes with Confluence's
 * structured info/note/warning/tip macro format.
 *
 * @see {@link https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts | GitHub Alerts }
 * @see {@link https://developer.atlassian.com/server/confluence/confluence-storage-format/ | Confluence Storage Format }
 *
 * @example
 *  <blockquote>
 *    <p>[!NOTE]<br/>This is a note</p>
 *  </blockquote>
 *  // becomes
 *  <ac:structured-macro ac:name="info">
 *    <ac:parameter ac:name="title">Note</ac:parameter>
 *    <ac:rich-text-body>
 *      <p>This is a note</p>
 *    </ac:rich-text-body>
 *  </ac:structured-macro>
 */
const rehypeReplaceAlerts: UnifiedPlugin<[], Root> =
  function rehypeReplaceAlerts() {
    return function transformer(tree) {
      replace(tree, { type: "element", tagName: "blockquote" }, (node) => {
        // Check if this blockquote is a GitHub alert
        const alertInfo = extractAlertInfo(node);

        if (!alertInfo) {
          // Not a GitHub alert, return unchanged
          return node;
        }

        // Build the Confluence macro
        const macroName = ALERT_TO_MACRO[alertInfo.type];
        const macroChildren: HastElement[] = [];

        // Add title parameter
        macroChildren.push({
          type: "element" as const,
          tagName: "ac:parameter",
          properties: {
            "ac:name": "title",
          },
          children: [
            {
              type: "raw" as const,
              value: ALERT_TITLES[alertInfo.type],
            },
          ],
        });

        // Add the content in a rich text body
        macroChildren.push({
          type: "element" as const,
          tagName: "ac:rich-text-body",
          properties: {},
          children: alertInfo.content,
        });

        return {
          type: "element" as const,
          tagName: "ac:structured-macro",
          properties: {
            "ac:name": macroName,
          },
          children: macroChildren,
        };
      });
    };
  };

/**
 * Interface for alert information extracted from a blockquote
 */
interface AlertInfo {
  type: AlertType;
  content: HastElement["children"];
}

/**
 * Extract alert information from a blockquote element if it contains a
 * GitHub alert marker.
 *
 * @param blockquote - The blockquote element to check
 * @returns Alert information if this is a GitHub alert, undefined otherwise
 */
function extractAlertInfo(blockquote: HastElement): AlertInfo | undefined {
  if (blockquote.children.length === 0) {
    return undefined;
  }

  // Find the first non-whitespace child (skip whitespace text nodes)
  let contentChild = blockquote.children[0];
  let childIndex = 0;

  while (
    contentChild &&
    contentChild.type === "text" &&
    !(contentChild as HastText).value.trim()
  ) {
    childIndex++;
    if (childIndex >= blockquote.children.length) {
      return undefined;
    }
    contentChild = blockquote.children[childIndex];
  }

  // Handle two cases: text node directly or paragraph element
  let textNode: HastText | undefined;
  let isDirectText = false;

  if (contentChild.type === "text") {
    // Direct text node with actual content
    textNode = contentChild as HastText;
    isDirectText = true;
  } else if (contentChild.type === "element" && contentChild.tagName === "p") {
    // Paragraph element
    const paragraph = contentChild as HastElement;
    const firstNode = paragraph.children[0];
    if (firstNode && firstNode.type === "text") {
      textNode = firstNode as HastText;
    }
  }

  if (!textNode) {
    return undefined;
  }

  const text = textNode.value;

  // Check if it starts with an alert marker
  const alertMatch = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
  if (!alertMatch) {
    return undefined;
  }

  const alertType = alertMatch[1] as AlertType;

  // Remove the alert marker from the text
  const remainingText = text.substring(alertMatch[0].length).trim();

  // Build content based on structure
  const content: HastElement["children"] = [];

  if (isDirectText) {
    // For direct text, wrap remaining content in a paragraph
    if (remainingText) {
      content.push({
        type: "element",
        tagName: "p",
        properties: {},
        children: [
          {
            type: "text",
            value: remainingText,
          } as HastText,
        ],
      } as HastElement);
    }
    // Add any other children from the blockquote (after the text node we used)
    content.push(...blockquote.children.slice(childIndex + 1));
  } else {
    // For paragraph structure
    const paragraph = contentChild as HastElement;
    const newParagraphChildren = [...paragraph.children];

    if (remainingText) {
      newParagraphChildren[0] = {
        type: "text",
        value: remainingText,
      } as HastText;
    } else {
      newParagraphChildren.shift();
    }

    if (newParagraphChildren.length > 0) {
      content.push({
        ...paragraph,
        children: newParagraphChildren,
      });
    }

    // Add any other children from the blockquote (after the paragraph we used)
    content.push(...blockquote.children.slice(childIndex + 1));
  }

  return {
    type: alertType,
    content,
  };
}

export default rehypeReplaceAlerts;
