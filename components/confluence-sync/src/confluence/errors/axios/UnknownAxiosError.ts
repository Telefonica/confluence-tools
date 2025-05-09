// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { AxiosError } from "axios";

export class UnknownAxiosError extends Error {
  constructor(error: AxiosError) {
    super(
      `Axios Error
                      Response: ${JSON.stringify(error.response?.data, null, 2)}`,
      { cause: error },
    );
  }
}
