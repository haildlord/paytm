import type { ContentfulStatusCode } from "hono/utils/http-status";

// Same idea as backend/utils/AppError.js: throw it anywhere, and app.onError turns it
// into `{ success: false, message }` with the right status code.
export class AppError extends Error {
  statusCode: ContentfulStatusCode;

  constructor(message: string, statusCode: ContentfulStatusCode) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
