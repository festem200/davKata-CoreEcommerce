export class MissingIdempotencyKeyError extends Error {
  constructor() {
    super("El header 'Idempotency-Key' es obligatorio en el checkout");
    this.name = "MissingIdempotencyKeyError";
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Se requiere una API key válida en el header 'X-Api-Key'");
    this.name = "UnauthorizedError";
  }
}
