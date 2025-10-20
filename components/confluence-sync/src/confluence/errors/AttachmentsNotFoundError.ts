// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { CustomError } from "./CustomError";
import { getCauseMessage } from "./ErrorHelpers";

export class AttachmentsNotFoundError extends CustomError {
  constructor(id: string, options?: ErrorOptions) {
    super(
      `Error getting attachments of page with id ${id}: ${getCauseMessage(options?.cause)}`,
      options,
    );
  }
}
