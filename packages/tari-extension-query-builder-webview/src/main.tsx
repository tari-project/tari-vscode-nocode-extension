import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Message, Messenger, TariFlowMessages } from "tari-extension-common";

const messenger = registerMessenger();
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
createRoot(rootElement).render(
  <StrictMode>
    <App messenger={messenger} />
  </StrictMode>,
);

function registerMessenger(): Messenger<TariFlowMessages> | undefined {
  const vsCodeActive = typeof window.acquireVsCodeApi === "function";
  if (!vsCodeActive) {
    return;
  }
  const vscode = acquireVsCodeApi();
  const messenger = new Messenger<TariFlowMessages>({
    sendMessage: (msg) => {
      vscode.postMessage(msg);
    },
    onMessage: (callback) => {
      window.addEventListener("message", (event: MessageEvent<unknown>) => {
        if ("data" in event) {
          callback(event.data as Message<keyof TariFlowMessages, TariFlowMessages>);
        }
      });
    },
  });
  return messenger;
}
