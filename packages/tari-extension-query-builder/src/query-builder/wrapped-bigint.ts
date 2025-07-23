export class WrappedBigInt {
  private value: bigint;

  constructor(value: bigint | string | WrappedBigInt) {
    if (value instanceof WrappedBigInt) {
      this.value = value.value;
    } else if (typeof value === "string") {
      this.value = BigInt(value);
    } else {
      this.value = value;
    }
  }

  toJSON(): string {
    return this.value.toString();
  }

  toString(): string {
    return this.value.toString();
  }

  valueOf(): bigint {
    return this.value;
  }
}
