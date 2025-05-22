import * as vscode from "vscode";

export class VirtualDocumentProvider implements vscode.TextDocumentContentProvider {
  static scheme = "virtual-format";
  private docs = new Map<string, string>();
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this._onDidChange.event;

  public createVirtualDocument(content: string): vscode.Uri {
    const id = Math.random().toString(36).slice(2);
    const uri = vscode.Uri.parse(`${VirtualDocumentProvider.scheme}:/doc-${id}.ts`);
    this.docs.set(uri.path, content);
    return uri;
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.docs.get(uri.path) ?? "";
  }

  disposeDocument(uri: vscode.Uri) {
    this.docs.delete(uri.path);
  }
}
