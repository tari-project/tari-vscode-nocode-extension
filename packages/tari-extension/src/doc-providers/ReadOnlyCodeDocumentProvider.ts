import { GeneratedCodeType } from "tari-extension-common";
import * as vscode from "vscode";

export interface CodeDocumentDetails {
  id: string;
  code: string;
  type: GeneratedCodeType;
}

export class ReadOnlyCodeDocumentProvider implements vscode.TextDocumentContentProvider {
  public static scheme = "readonly-code";
  private documents = new Map<string, CodeDocumentDetails>();
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

  readonly onDidChange: vscode.Event<vscode.Uri> = this._onDidChange.event;

  public static getUriById(id: string, type: GeneratedCodeType): vscode.Uri {
    const extension = type === GeneratedCodeType.Typescript ? "ts" : "js";
    return vscode.Uri.parse(`${ReadOnlyCodeDocumentProvider.scheme}://authority/${id}.${extension}`);
  }

  public createDocument(details: CodeDocumentDetails): vscode.Uri | null {
    const uri = ReadOnlyCodeDocumentProvider.getUriById(details.id, details.type);
    if (this.documents.has(uri.path)) {
      return null;
    }

    this.documents.set(uri.path, details);
    return uri;
  }

  public provideTextDocumentContent(uri: vscode.Uri): string {
    return this.documents.get(uri.path)?.code ?? "";
  }

  public deleteDocument(uri: vscode.Uri) {
    this.documents.delete(uri.path);
  }
}
