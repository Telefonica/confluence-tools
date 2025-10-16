// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { CustomError } from "./CustomError";

import { getCauseMessage } from "./ErrorHelpers";

export class CreatePageError extends CustomError {
  constructor(title: string, options?: ErrorOptions) {
    super(
      `Error creating page with title ${title}: ${getCauseMessage(options?.cause)}`,
      options,
    );
  }
}
