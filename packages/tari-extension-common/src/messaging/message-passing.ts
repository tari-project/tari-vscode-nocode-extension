import { TimedOutError } from "./TimedOutError";

interface MessageDefinition<RequestType, ResponseType> {
  request: RequestType;
  response: ResponseType;
}

type ActionName = string | number | symbol;

export type AllowedActions<T extends ActionName> = Record<T, MessageDefinition<unknown, unknown>>;

interface MessageRequest<K extends ActionName, T extends AllowedActions<K>> {
  correlationId: string;
  command: K;
  data: T[K]["request"];
}

type SuccessOrFailureReponse<K extends ActionName, T extends AllowedActions<K>> =
  | { success: true; data: T[K]["response"] }
  | { success: false; exception: string };

interface MessageResponse<K extends ActionName, T extends AllowedActions<K>> {
  correlationId: string;
  command: K;
  response: SuccessOrFailureReponse<K, T>;
}

export type Message<K extends ActionName, T extends AllowedActions<K>> = MessageRequest<K, T> | MessageResponse<K, T>;

// TODO:
// const DEFAULT_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const DEFAULT_TIMEOUT = 1000;

interface MessengerOptions<T extends AllowedActions<keyof T>> {
  sendMessage: (msg: Message<keyof T, T>) => void;
  onMessage: (callback: (msg: Message<keyof T, T>) => void) => void;
  requestTimeout?: number;
}

export class Messenger<T extends AllowedActions<keyof T>> {
  private pendingRequests = new Map<
    string,
    { resolve: (response: T[keyof T]["response"]) => void; reject: (error: Error) => void; timeoutId: NodeJS.Timeout }
  >();
  private handlers = new Map<keyof T, (request: unknown) => Promise<unknown>>();

  constructor(private options: MessengerOptions<T>) {
    options.onMessage((msg) => this.handleMessage(msg));
  }

  public send<K extends keyof T>(command: K, data: T[K]["request"], timeout?: number): Promise<T[K]["response"]> {
    return new Promise((resolve, reject) => {
      const correlationId = crypto.randomUUID();

      const timeoutId = setTimeout(
        () => {
          this.pendingRequests.delete(correlationId);
          reject(new TimedOutError());
        },
        timeout ?? this.options.requestTimeout ?? DEFAULT_TIMEOUT,
      );

      this.pendingRequests.set(correlationId, { resolve, reject, timeoutId });
      this.options.sendMessage({ correlationId, command, data });
    });
  }

  public registerHandler<K extends keyof T>(
    command: K,
    handler: (request: T[K]["request"]) => Promise<T[K]["response"]>,
  ) {
    this.handlers.set(command, handler);
  }

  private async handleMessage(msg: Message<keyof T, T>) {
    if ("response" in msg) {
      const entry = this.pendingRequests.get(msg.correlationId);
      if (entry) {
        this.pendingRequests.delete(msg.correlationId);
        clearTimeout(entry.timeoutId);
        if (msg.response.success) {
          entry.resolve(msg.response.data);
        } else {
          entry.reject(new Error(msg.response.exception));
        }
      }
    } else {
      const handler = this.handlers.get(msg.command);
      if (!handler) return;

      let response: MessageResponse<keyof T, T>["response"] | undefined;
      try {
        const data = (await handler(msg.data)) ?? null;
        response = { success: true, data };
      } catch (e) {
        const exception = e instanceof Error ? e.message : String(e);
        response = { success: false, exception };
      }

      this.options.sendMessage({
        correlationId: msg.correlationId,
        command: msg.command,
        response,
      });
    }
  }
}
