// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import { CustomError } from "./CustomError";

export class UnknownError extends CustomError {
  constructor() {
    super(`Unknown Error`);
  }
}
