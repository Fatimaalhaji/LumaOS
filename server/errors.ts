export class UnauthorizedError extends Error { constructor() { super("Unauthorized"); } }
export class NotFoundError extends Error { constructor() { super("Resource not found"); } }
export class ValidationError extends Error { constructor(message = "Invalid input") { super(message); } }
export function toActionError(error: unknown) { if (error instanceof UnauthorizedError || error instanceof NotFoundError || error instanceof ValidationError) return error.message; return "Something went wrong. Please try again."; }
