export class MissingDataError extends Error {
  constructor(
    public nodes: string[],
    message?: string,
  ) {
    super(message ?? `Missing data for nodes: ${nodes.join(", ")}.`);
    this.name = "MissingDataError";
    Object.setPrototypeOf(this, MissingDataError.prototype);
  }
}
