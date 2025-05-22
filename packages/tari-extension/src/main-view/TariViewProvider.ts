import * as vscode from "vscode";
import { AllowedActions, Messenger } from "tari-extension-common";
import { getHtmlForWebview } from "../webview";

export class TariViewProvider<T extends AllowedActions<keyof T>> implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private messenger?: Messenger<T>;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly extensionUri: vscode.Uri,
    private setupMessenger: (messenger: Messenger<T>) => void,
    private onDispose: () => void,
  ) {}

  public async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    this.view = webviewView;
    const webView = webviewView.webview;

    webView.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };
    webView.html = await getHtmlForWebview(webView, this.extensionUri, "webview");

    this.messenger = new Messenger<T>({
      sendMessage: (msg) => webView.postMessage(msg),
      onMessage: (callback) => {
        this.context.subscriptions.push(webView.onDidReceiveMessage(callback));
      },
    });
    this.setupMessenger(this.messenger);

    webviewView.onDidDispose(() => {
      this.onDispose();
    });
    // webviewView.onDidChangeVisibility(() => {
    // if (!webviewView.visible) {
    // this.onDispose();
    // }
    // });
  }

  public send<K extends keyof T>(command: K, data: T[K]["request"]): Promise<T[K]["response"]> {
    if (!this.messenger) {
      throw new Error("Messenger not initialized");
    }
    return this.messenger.send(command, data);
  }
}
