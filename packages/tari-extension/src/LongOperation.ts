import * as vscode from "vscode";
import TypedEmitter from "typed-emitter";
import { EventEmitter } from "events";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type EmittedEvents = {
  stop: (cancelled: boolean) => void;
};

export class LongOperation extends (EventEmitter as new () => TypedEmitter<EmittedEvents>) {
  private progress?: vscode.Progress<{
    message?: string;
    increment?: number;
  }>;

  constructor(
    private title: string,
    private cancellable: boolean,
  ) {
    super();
  }

  public async start(): Promise<boolean> {
    const cancelled = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: this.title,
        cancellable: this.cancellable,
      },
      (progress, token) => {
        this.progress = progress;

        token.onCancellationRequested(() => {
          this.emit("stop", true);
        });

        return new Promise<boolean>((resolve) => {
          this.on("stop", (cancelled) => {
            resolve(cancelled);
          });
        });
      },
    );
    return cancelled;
  }

  public update(increment: number, message: string): void {
    if (this.progress) {
      this.progress.report({ increment, message });
    }
  }

  public end(): void {
    this.emit("stop", false);
  }
}
