// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { AxiosError } from "axios";
import { CustomError } from "../CustomError";

export class InternalServerError extends CustomError {
  constructor(error: AxiosError) {
    super(
      `Internal Server Error
                  Response: ${JSON.stringify(error.response?.data, null, 2)}`,
      { cause: error },
    );
  }
}
