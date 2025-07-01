import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import {
  ExecuteTransactionRequest,
  Message,
  Messenger,
  TariConfigurationKey,
  WebViewMessages,
} from "@tari-project/tari-extension-common";
import { useTariStore } from "./store/tari-store";
import {
  buildTransactionRequest,
  GetTransactionResultResponse,
  TariSigner,
  TransactionStatus,
} from "@tari-project/tarijs-all";
import { SerializedTariStore } from "./store/types";
import { UnsignedTransactionV1 } from "@tari-project/typescript-bindings";

registerMessenger();
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

function registerMessenger() {
  const vsCodeActive = typeof window.acquireVsCodeApi === "function";
  if (!vsCodeActive) {
    return;
  }
  const vscode = acquireVsCodeApi<SerializedTariStore>();
  const messenger = new Messenger<WebViewMessages>({
    sendMessage: (msg) => {
      vscode.postMessage(msg);
    },
    onMessage: (callback) => {
      window.addEventListener("message", (event: MessageEvent<unknown>) => {
        if ("data" in event) {
          callback(event.data as Message<keyof WebViewMessages, WebViewMessages>);
        }
      });
    },
  });
  useTariStore.setState({ vscode, messenger });

  messenger.registerHandler("configurationChanged", (configuration) => {
    const setConfiguration = useTariStore((state) => state.setConfiguration);
    setConfiguration(configuration);
    return Promise.resolve(undefined);
  });

  messenger.registerHandler("getAccountAddress", () => {
    const accountData = useTariStore.getState().accountData;
    return accountData ? Promise.resolve(accountData.address) : Promise.reject(new Error("Please, connect first!"));
  });

  messenger.registerHandler("executeTransaction", async (request: ExecuteTransactionRequest) => {
    const {
      accountData,
      signer,
      closeAllActions,
      setTransactionExecutionActionsOpen,
      transactionExecutionAction,
      configuration,
    } = useTariStore.getState();
    if (!signer || !accountData) {
      throw new Error("Please, connect first!");
    }

    closeAllActions();
    setTransactionExecutionActionsOpen(true);

    const submitTransactionRequest = buildTransactionRequest(
      request.transaction as unknown as UnsignedTransactionV1,
      accountData.account_id,
    );
    const response = await signer.submitTransaction(submitTransactionRequest);
    const result = await waitForAnyTransactionResult(signer, response.transaction_id);
    transactionExecutionAction.addTransactionExecution(
      result,
      configuration ? configuration[TariConfigurationKey.MaxTransactionExecutionResults] : undefined,
    );
    return undefined;
  });
}

// TODO:
/*
function getNetwork(network: TariNetwork) {
  switch (network) {
    case TariNetwork.MainNet:
      return Network.MainNet;
    case TariNetwork.StageNet:
      return Network.StageNet;
    case TariNetwork.NextNet:
      return Network.NextNet;
    case TariNetwork.LocalNet:
      return Network.LocalNet;
    case TariNetwork.Igor:
      return Network.Igor;
    case TariNetwork.Esmeralda:
      return Network.Esmeralda;
  }
}
*/

export async function waitForAnyTransactionResult(
  signer: TariSigner,
  transactionId: string,
): Promise<GetTransactionResultResponse> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const resp = await signer.getTransactionResult(transactionId);
    const FINALIZED_STATUSES = [
      TransactionStatus.Accepted,
      TransactionStatus.Rejected,
      TransactionStatus.InvalidTransaction,
      TransactionStatus.OnlyFeeAccepted,
      TransactionStatus.DryRun,
    ];
    if (FINALIZED_STATUSES.includes(resp.status)) {
      return resp;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
