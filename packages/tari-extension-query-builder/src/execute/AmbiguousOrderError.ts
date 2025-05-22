export class AmbiguousOrderError extends Error {
  constructor(
    public nodeA: string,
    public nodeB: string,
    message?: string,
  ) {
    super(
      message ?? `Ambiguous execution order between nodes ${nodeA} and ${nodeB}. Please, add explicit connections.`,
    );
    this.name = "AmbiguousOrderError";
    Object.setPrototypeOf(this, AmbiguousOrderError.prototype);
  }
}
