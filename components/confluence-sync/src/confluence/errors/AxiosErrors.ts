// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

import type { AxiosError } from "axios";
import { HttpStatusCode } from "axios";

import { BadRequestError } from "./axios/BadRequestError";
import { InternalServerError } from "./axios/InternalServerError";
import { UnauthorizedError } from "./axios/UnauthorizedError";
import { UnexpectedError } from "./axios/UnexpectedError";
import { UnknownAxiosError } from "./axios/UnknownAxiosError";
import { UnknownError } from "./UnknownError";

import { CustomError } from "./CustomError";

export function toConfluenceClientError(error: unknown): CustomError {
  if ((error as AxiosError).name === "AxiosError") {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === HttpStatusCode.BadRequest) {
      return new BadRequestError(axiosError);
    }
    if (
      axiosError.response?.status === HttpStatusCode.Unauthorized ||
      axiosError.response?.status === HttpStatusCode.Forbidden
    ) {
      return new UnauthorizedError(axiosError);
    }
    if (axiosError.response?.status === HttpStatusCode.InternalServerError) {
      return new InternalServerError(axiosError);
    }

    return new UnknownAxiosError(axiosError);
  }
  if (!error) {
    return new UnknownError();
  }
  return new UnexpectedError((error as Error).message || error);
}
