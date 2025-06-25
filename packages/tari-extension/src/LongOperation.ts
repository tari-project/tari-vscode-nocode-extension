import * as vscode from "vscode";
import { EventEmitter } from "events";

export class LongOperation extends EventEmitter {
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
          this.once("stop", (cancelled: boolean) => {
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
