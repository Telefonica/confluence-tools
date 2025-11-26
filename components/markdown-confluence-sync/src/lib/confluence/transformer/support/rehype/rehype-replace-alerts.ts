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

  const firstChild = blockquote.children[0];

  // GitHub alerts are rendered as blockquotes with a paragraph as the
  // first child
  if (firstChild.type !== "element" || firstChild.tagName !== "p") {
    return undefined;
  }

  const paragraph = firstChild as HastElement;

  // Get the text content of the first node in the paragraph
  const firstNode = paragraph.children[0];
  if (!firstNode || firstNode.type !== "text") {
    return undefined;
  }

  const text = (firstNode as HastText).value;

  // Check if it starts with an alert marker
  const alertMatch = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
  if (!alertMatch) {
    return undefined;
  }

  const alertType = alertMatch[1] as AlertType;

  // Remove the alert marker from the text
  const remainingText = text.substring(alertMatch[0].length).trim();

  // Create new paragraph children without the alert marker
  const newParagraphChildren = [...paragraph.children];

  // If there's remaining text after the marker, update the first text node
  if (remainingText) {
    newParagraphChildren[0] = {
      type: "text",
      value: remainingText,
    } as HastText;
  } else {
    // Remove the first text node entirely if it only contained the marker
    newParagraphChildren.shift();
  }

  // Build the content - include the modified first paragraph and any
  // remaining children of the blockquote
  const content: HastElement["children"] = [];

  // Add the first paragraph with the marker removed
  if (newParagraphChildren.length > 0) {
    content.push({
      ...paragraph,
      children: newParagraphChildren,
    });
  }

  // Add any additional children from the blockquote
  content.push(...blockquote.children.slice(1));

  return {
    type: alertType,
    content,
  };
}

export default rehypeReplaceAlerts;
