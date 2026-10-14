/**
 * Canonical Orbitus API Response Envelope
 *
 * Contract:
 * {
 *   statusCode: number,  // HTTP status code (e.g. 200, 201)
 *   success: boolean,    // true if statusCode < 400
 *   message: string,     // Human-readable status message
 *   data: any            // Domain payload (object, array, null, primitive)
 * }
 *
 * Migration & Adapter Notice:
 * In legacy controllers, certain top-level fields were accessed directly by frontend consumers
 * (e.g. `res.data.user`, `res.data.group`, `res.data.skills`).
 * The explicit adapter below populates non-conflicting payload properties to preserve backward
 * compatibility while all frontend endpoints transition to canonical `res.data.data.<entity>`.
 * Removal Target: Next minor release after frontend full migration.
 */
export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;

    // Temporary migration adapter: shallow-assign payload properties onto this
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const source = typeof data.toObject === 'function' ? data.toObject() : data;
      for (const [key, value] of Object.entries(source)) {
        if (!(key in this)) {
          this[key] = value;
        }
      }
    }
  }
}

export default ApiResponse;
