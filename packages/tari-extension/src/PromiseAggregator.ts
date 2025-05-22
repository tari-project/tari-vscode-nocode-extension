// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class PromiseAggregator<T extends { [K in keyof T]: (...args: any[]) => Promise<any> }> {
  private subscribers = new Map<keyof T, (...args: Parameters<T[keyof T]>) => ReturnType<T[keyof T]>>();

  public subscribe<K extends keyof T>(methodName: K, callback: (...args: Parameters<T[K]>) => ReturnType<T[K]>): void {
    this.subscribers.set(methodName, callback);
  }

  public unsubscribe<K extends keyof T>(methodName: K): void {
    this.subscribers.delete(methodName);
  }

  public async invoke<K extends keyof T>(methodName: K, ...args: Parameters<T[K]>): Promise<ReturnType<T[K]>> {
    const subscriber = this.subscribers.get(methodName);
    if (subscriber) {
      return subscriber(...args);
    } else {
      throw new NoSubscriberError(String(methodName));
    }
  }

  public createProxy(): T {
    const proxy: Partial<T> = {};
    for (const methodName of this.subscribers.keys()) {
      proxy[methodName as keyof T] = ((...args: unknown[]) =>
        this.invoke(methodName as keyof T, ...(args as Parameters<T[keyof T]>))) as T[keyof T];
    }
    return proxy as T;
  }
}

export class NoSubscriberError extends Error {
  constructor(
    public method: string,
    message?: string,
  ) {
    super(message ?? `No subsriber for method: ${method}.`);
    this.name = "NoSubscriberError";
    Object.setPrototypeOf(this, NoSubscriberError.prototype);
  }
}
