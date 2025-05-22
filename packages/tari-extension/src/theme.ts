import * as vscode from "vscode";
import { Theme } from "tari-extension-common";

export function getTheme(colorTheme: vscode.ColorTheme): Theme {
  return colorTheme.kind === vscode.ColorThemeKind.Light ? "light" : "dark";
}
