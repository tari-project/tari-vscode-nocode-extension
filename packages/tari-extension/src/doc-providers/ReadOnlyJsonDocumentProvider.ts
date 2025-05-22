import { JsonOutlineItem } from "tari-extension-common";
import * as vscode from "vscode";

export interface JsonDocumentDetails {
  id: string;
  json: string;
  outlineItems: JsonOutlineItem[];
}

export class ReadOnlyJsonDocumentProvider implements vscode.TextDocumentContentProvider {
  public static scheme = "readonly-json";
  private documents = new Map<string, JsonDocumentDetails>();
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

  readonly onDidChange: vscode.Event<vscode.Uri> = this._onDidChange.event;

  public static getUriById(id: string): vscode.Uri {
    return vscode.Uri.parse(`${ReadOnlyJsonDocumentProvider.scheme}://authority/${id}.json`);
  }

  public createDocument(details: JsonDocumentDetails): vscode.Uri | null {
    const uri = ReadOnlyJsonDocumentProvider.getUriById(details.id);
    if (this.documents.has(uri.path)) {
      return null;
    }

    this.documents.set(uri.path, details);
    return uri;
  }

  public provideTextDocumentContent(uri: vscode.Uri): string {
    return this.documents.get(uri.path)?.json ?? "";
  }

  public deleteDocument(uri: vscode.Uri) {
    this.documents.delete(uri.path);
  }

  public updateDecorations(editor: vscode.TextEditor) {
    const details = this.documents.get(editor.document.uri.path);
    if (!details) {
      return;
    }
    for (const item of details.outlineItems) {
      const details = item.details ? ` (${item.details})` : "";
      const decorationType = vscode.window.createTextEditorDecorationType({
        before: {
          contentText: `${item.title}${details} `,
          color: "grey",
        },
      });
      const startPos = editor.document.positionAt(item.offset);
      const endPos = editor.document.positionAt(item.offset + item.length);

      const range = new vscode.Range(startPos, endPos);

      let hoverMessage: vscode.MarkdownString | undefined = undefined;
      if (item.hoverMessage) {
        hoverMessage = new vscode.MarkdownString();
        hoverMessage.appendCodeblock(item.hoverMessage.text, item.hoverMessage.language);
      }
      const decoration: vscode.DecorationOptions = { range: range, hoverMessage };

      editor.setDecorations(decorationType, [decoration]);
    }
  }
}
