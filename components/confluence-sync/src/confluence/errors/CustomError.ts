export class CustomError extends Error {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args);
  }
}
