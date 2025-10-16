// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { CustomError } from "./CustomError";

import { getCauseMessage } from "./ErrorHelpers";

export class UpdatePageError extends CustomError {
  constructor(id: string, title: string, options?: ErrorOptions) {
    super(
      `Error updating page with id ${id} and title ${title}: ${getCauseMessage(options?.cause)}`,
      options,
    );
  }
}
