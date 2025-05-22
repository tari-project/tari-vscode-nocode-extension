import * as vscode from "vscode";
import * as fs from "fs";

export function getHtmlForWebview(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  webViewDirectory: string,
  indexFile = "index.html",
): string {
  const distPath = vscode.Uri.joinPath(extensionUri, "dist", webViewDirectory);
  const webviewPath = vscode.Uri.joinPath(distPath, indexFile);
  const html = fs.readFileSync(webviewPath.fsPath, "utf8");
  return prepareWebviewHtml(html, webview.cspSource, distPath, webview);
}

export function prepareWebviewHtml(
  html: string,
  cspSource: string,
  distPath: vscode.Uri,
  webview: vscode.Webview,
): string {
  const nonce = getNonce();
  let updatedHtml = html;

  //const csp = `default-src 'none'; font-src ${cspSource}; style-src ${cspSource}; script-src 'nonce-${nonce}';`;
  // TODO: make this CSP more restrictive
  const csp = `default-src *; style-src * 'unsafe-inline'`;
  const cspMetaTag = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
  updatedHtml = updatedHtml.replace(/<head>/i, (match) => `${match}\n${cspMetaTag}`);

  const replaceAssetLinks = (htmlContent: string, tag: "script" | "link", attribute: "src" | "href") => {
    const tagRegex = new RegExp(`<${tag}(.*?) ${attribute}="([^"]+)"(.*?)>`, "g");
    return htmlContent.replace(tagRegex, (_match, preAttr, url, postAttr) => {
      const assetFullPath = vscode.Uri.joinPath(distPath, url.substring(1));
      const webviewUri = webview.asWebviewUri(assetFullPath);
      return `<${tag}${preAttr} ${attribute}="${webviewUri.toString()}"${postAttr}>`;
    });
  };

  updatedHtml = replaceAssetLinks(updatedHtml, "script", "src");
  updatedHtml = replaceAssetLinks(updatedHtml, "link", "href");
  updatedHtml = updatedHtml.replace(/<script(.*?)>/g, `<script nonce="${nonce}"$1>`);

  return updatedHtml;
}

export function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
