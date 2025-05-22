export class CycleDetectedError extends Error {
  constructor(message?: string) {
    super(message ?? "Cycle detected in the flow graph");
    this.name = "CycleDetectedError";
    Object.setPrototypeOf(this, CycleDetectedError.prototype);
  }
}
