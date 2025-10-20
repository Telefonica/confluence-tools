// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { CustomError } from "../CustomError";

export class UnexpectedError extends CustomError {
  constructor(error: unknown) {
    super(`Unexpected Error: ${error}`);
  }
}
