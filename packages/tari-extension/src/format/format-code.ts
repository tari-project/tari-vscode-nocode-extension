import * as vscode from "vscode";
import { VirtualDocumentProvider } from "../doc-providers/VirtualDocumentProvider";

export async function formatCode(code: string, language: string, provider: VirtualDocumentProvider): Promise<string> {
  const uri = provider.createVirtualDocument(code);
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.languages.setTextDocumentLanguage(doc, language);

  const edits: vscode.TextEdit[] = await vscode.commands.executeCommand("vscode.executeFormatDocumentProvider", uri, {
    tabSize: 2,
    insertSpaces: true,
  });

  if (!edits || edits.length === 0) {
    provider.disposeDocument(uri);
    return code;
  }

  const sorted = edits.sort((a, b) => b.range.start.compareTo(a.range.start));
  let result = code;
  for (const edit of sorted) {
    const start = doc.offsetAt(edit.range.start);
    const end = doc.offsetAt(edit.range.end);
    result = result.slice(0, start) + edit.newText + result.slice(end);
  }

  provider.disposeDocument(uri);
  return result;
}
