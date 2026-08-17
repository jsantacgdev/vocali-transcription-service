export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Cannot transition from ${from} to ${to}`, "INVALID_TRANSITION");
  }
}

export class TranscriptionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Transcription ${id} not found`, "NOT_FOUND");
  }
}

export class UnauthorizedAccessError extends DomainError {
  constructor() {
    super("Access denied to this resource", "FORBIDDEN");
  }
}

export class FileTooLargeError extends DomainError {
  constructor(maxBytes: number) {
    super(`File exceeds ${maxBytes} bytes`, "FILE_TOO_LARGE");
  }
}
