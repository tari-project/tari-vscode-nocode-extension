import * as vscode from "vscode";
import { TariViewProvider } from "./main-view/TariViewProvider";
import {
  ExecuteTransactionBaseRequest,
  GeneratedCodeType,
  ShowGeneratedCodeRequest,
  TariConfiguration,
  TariConfigurationKey,
  TariNetwork,
  TariProviderType,
  TimedOutError,
  WebViewMessages,
} from "@tari-project/tari-extension-common";
import { LongOperation } from "./LongOperation";
import { ReadOnlyJsonDocumentProvider } from "./doc-providers/ReadOnlyJsonDocumentProvider";
import { TariFlowEditorProvider } from "./flow-view/TariFlowEditor";
import { PromiseAggregator } from "./PromiseAggregator";
import { FlowToTariView } from "./types";
import { ReadOnlyCodeDocumentProvider } from "./doc-providers/ReadOnlyCodeDocumentProvider";
import { v4 as uuidv4 } from "uuid";
import { formatCode } from "./format/format-code";
import { VirtualDocumentProvider } from "./doc-providers/VirtualDocumentProvider";

const CONFIGURATION_ROOT = "tari";

export function activate(context: vscode.ExtensionContext) {
  console.log("Extension 'tari-extension' is now active!");

  let longOperation: LongOperation | undefined;

  const readonlyDocumentProvider = new ReadOnlyJsonDocumentProvider();
  const readonlyCodeProvider = new ReadOnlyCodeDocumentProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(ReadOnlyJsonDocumentProvider.scheme, readonlyDocumentProvider),
  );
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(ReadOnlyCodeDocumentProvider.scheme, readonlyCodeProvider),
  );
  const virtualProvider = new VirtualDocumentProvider();
  vscode.workspace.registerTextDocumentContentProvider(VirtualDocumentProvider.scheme, virtualProvider);

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (doc.uri.scheme === ReadOnlyJsonDocumentProvider.scheme) {
        readonlyDocumentProvider.deleteDocument(doc.uri);
      }
      if (doc.uri.scheme === ReadOnlyCodeDocumentProvider.scheme) {
        readonlyCodeProvider.deleteDocument(doc.uri);
      }
    }),
  );
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.uri.scheme === ReadOnlyJsonDocumentProvider.scheme) {
        readonlyDocumentProvider.updateDecorations(editor);
      }
    }),
  );

  const flowToTariView = new PromiseAggregator<FlowToTariView>();

  // Tari Flow Editor
  const tariFlowEditorProvider = new TariFlowEditorProvider(context, flowToTariView);
  context.subscriptions.push(tariFlowEditorProvider.register());
  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme((colorTheme) => {
      tariFlowEditorProvider.updateColorScheme(colorTheme).catch(console.error);
    }),
  );

  const tariViewProvider = new TariViewProvider<WebViewMessages>(
    context,
    context.extensionUri,
    (messenger) => {
      messenger.registerHandler("showError", ({ message, detail }) => {
        const modal = !!detail;
        vscode.window.showErrorMessage(message, { modal, detail });
        return Promise.resolve(undefined);
      });
      messenger.registerHandler("getConfiguration", () => {
        return Promise.resolve(fetchConfiguration());
      });
      messenger.registerHandler("setWalletDaemonAddress", async (walletDaemonAddress) => {
        await getRootConfiguration().update(
          TariConfigurationKey.WalletDaemonAddress,
          walletDaemonAddress,
          vscode.ConfigurationTarget.Global,
        );
        return undefined;
      });
      messenger.registerHandler("setWalletConnectProjectId", async (walletConnectProjectId) => {
        await getRootConfiguration().update(
          TariConfigurationKey.WalletConnectProjectId,
          walletConnectProjectId,
          vscode.ConfigurationTarget.Global,
        );
        return undefined;
      });
      messenger.registerHandler("setDefaultProvider", async (defaultProvider) => {
        await getRootConfiguration().update(
          TariConfigurationKey.DefaultProvider,
          defaultProvider,
          vscode.ConfigurationTarget.Global,
        );
        return undefined;
      });
      messenger.registerHandler("setNetwork", async (network) => {
        await getRootConfiguration().update(TariConfigurationKey.Network, network, vscode.ConfigurationTarget.Global);
        return undefined;
      });
      messenger.registerHandler("showLongOperation", async ({ title, cancellable }) => {
        longOperation = new LongOperation(title, cancellable);
        const cancelled = await longOperation.start();
        longOperation = undefined;
        return { cancelled };
      });
      messenger.registerHandler("updateLongOperation", ({ increment, message }) => {
        longOperation?.update(increment, message);
        return Promise.resolve(undefined);
      });
      messenger.registerHandler("endLongOperation", () => {
        longOperation?.end();
        return Promise.resolve(undefined);
      });
      messenger.registerHandler("showJsonOutline", async ({ id, json, outlineItems, selected }) => {
        const uri = readonlyDocumentProvider.createDocument({ id, json, outlineItems });
        if (uri) {
          const document = await vscode.workspace.openTextDocument(uri);
          await vscode.languages.setTextDocumentLanguage(document, "json");
          await vscode.window.showTextDocument(document, { preview: false });
        }
        if (selected) {
          const documentUri = ReadOnlyJsonDocumentProvider.getUriById(id);
          const editor = vscode.window.visibleTextEditors.find((e) => e.document.uri.path === documentUri.path);
          if (editor) {
            const startPos = editor.document.positionAt(selected.offset);
            const endPos = editor.document.positionAt(selected.offset + selected.length);
            editor.selection = new vscode.Selection(startPos, endPos);

            editor.revealRange(new vscode.Range(startPos, endPos), vscode.TextEditorRevealType.InCenter);

            if (vscode.window.activeTextEditor !== editor) {
              await vscode.window.showTextDocument(editor.document, { preview: false, viewColumn: editor.viewColumn });
            }
          }
        }
        return undefined;
      });
      messenger.registerHandler("newTariFlow", async () => {
        await vscode.commands.executeCommand("tari.flow-document.new");
        return undefined;
      });
      messenger.registerHandler("addTariFlowNode", (details) => {
        tariFlowEditorProvider.addNode(details);
        return Promise.resolve(undefined);
      });

      // Subscribe to flow to tari view
      flowToTariView.subscribe("getTransactionProps", async () => {
        try {
          const config = fetchConfiguration();
          const timeout = 200;
          const accountAddress = await messenger.send("getAccountAddress", undefined, timeout);
          return {
            network: config[TariConfigurationKey.Network],
            accountAddress,
            fee: config[TariConfigurationKey.MinTransactionFee],
          };
        } catch (e) {
          if (e instanceof TimedOutError) {
            throw new Error("Tari extension is not active. Please, switch to it and connect to your wallet!");
          }
          throw e;
        }
      });
      flowToTariView.subscribe("executeTransaction", async (request: ExecuteTransactionBaseRequest) => {
        try {
          const config = fetchConfiguration();
          const timeout = 30_000; // 30 seconds
          const executeTransactionRequest = {
            ...request,
            network: config[TariConfigurationKey.Network],
          };
          await messenger.send("executeTransaction", executeTransactionRequest, timeout);
          return undefined;
        } catch (e) {
          if (e instanceof TimedOutError) {
            throw new Error("Tari extension is not active. Please, switch to it and connect to your wallet!");
          }
          throw e;
        }
      });
      flowToTariView.subscribe("showGeneratedCode", async (request: ShowGeneratedCodeRequest) => {
        const id = uuidv4();
        const { code, type } = request;
        const language = type === GeneratedCodeType.Typescript ? "typescript" : "javascript";
        const formattedCode = await formatCode(code, type, virtualProvider);
        const uri = readonlyCodeProvider.createDocument({ id, code: formattedCode, type });
        if (uri) {
          const document = await vscode.workspace.openTextDocument(uri);
          await vscode.languages.setTextDocumentLanguage(document, language);
          await vscode.window.showTextDocument(document, { preview: false });
        }
      });
    },
    () => {
      flowToTariView.unsubscribe("getTransactionProps");
    },
  );
  context.subscriptions.push(vscode.window.registerWebviewViewProvider("tariActivityBarView", tariViewProvider));

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(CONFIGURATION_ROOT)) {
        tariViewProvider.send("configurationChanged", fetchConfiguration()).catch(console.error);
      }
    }),
  );
}

function fetchConfiguration(): TariConfiguration {
  const settings = getRootConfiguration();
  return {
    walletDaemonAddress: settings.get<string>(TariConfigurationKey.WalletDaemonAddress),
    walletConnectProjectId: settings.get<string>(TariConfigurationKey.WalletConnectProjectId),
    defaultProvider: (settings.get<string>(TariConfigurationKey.DefaultProvider) ??
      TariProviderType.WalletDemon) as TariProviderType,
    minTransactionFee: settings.get<number>(TariConfigurationKey.MinTransactionFee) ?? 3000,
    network: (settings.get<string>(TariConfigurationKey.Network) ?? TariNetwork.LocalNet) as TariNetwork,
    maxTransactionExecutionResults: settings.get<number>(TariConfigurationKey.MaxTransactionExecutionResults) ?? 5,
  };
}

function getRootConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(CONFIGURATION_ROOT);
}
