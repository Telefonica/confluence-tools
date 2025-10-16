// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { CustomError } from "./CustomError";

import { getCauseMessage } from "./ErrorHelpers";

export class PageNotFoundError extends CustomError {
  constructor(id: string, options?: ErrorOptions) {
    super(
      `Error getting page with id ${id}: ${getCauseMessage(options?.cause)}`,
      options,
    );
  }
}
