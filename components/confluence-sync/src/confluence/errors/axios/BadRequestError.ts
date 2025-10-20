// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0
import { CustomError } from "../CustomError";
import type { AxiosError } from "axios";

export class BadRequestError extends CustomError {
  constructor(error: AxiosError) {
    super(
      `Bad Request
          Response: ${JSON.stringify(error.response?.data, null, 2)}`,
      { cause: error },
    );
  }
}
