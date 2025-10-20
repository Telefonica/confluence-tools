// SPDX-FileCopyrightText: 2025 Telefónica Innovación Digital
// SPDX-License-Identifier: Apache-2.0

/**
 * Returns the error message from the cause if it is an instance of Error, otherwise returns the cause itself.
 * @param cause Cause of an error. It might be another error, or a string usually
 * @returns The message to print
 */
export function getCauseMessage(cause: unknown) {
  /* istanbul ignore next */
  return cause instanceof Error ? cause.message : cause;
}
