export class TimedOutError extends Error {
  constructor(message?: string) {
    super(message ?? "Operation timed out.");
    this.name = "TimedOutError";
    Object.setPrototypeOf(this, TimedOutError.prototype);
  }
}
