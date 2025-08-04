import { useCallback, useEffect, useState } from "react";
import { QueryBuilder } from "@tari-project/tari-extension-query-builder";
import { TariNetwork, Theme, TransactionProps } from "@tari-project/tari-extension-common";
import { WalletDaemonTariSigner } from "@tari-project/wallet-daemon-signer";

import "@tari-project/tari-extension-query-builder/dist/tari-extension-query-builder.css";
import "./root.css";
import { TariPermissions, WalletDaemonFetchParameters } from "@tari-project/wallet-daemon-signer";
import { UnsignedTransactionV1 } from "@tari-project/typescript-bindings";
import {
  buildTransactionRequest,
  GetTransactionResultResponse,
  TariSigner,
  TransactionStatus,
} from "@tari-project/tarijs-all";

interface SetThemeMessage {
  type: "SET_THEME";
  payload: {
    theme: Theme;
  };
}

interface SetLanguageMessage {
  type: "SET_LANGUAGE";
  payload: {
    language: string;
  };
}

type HostMessage = SetThemeMessage | SetLanguageMessage;

function App() {
  const [signer, setSigner] = useState<WalletDaemonTariSigner | null>(null);
  const [network, setNetwork] = useState<TariNetwork | null>(null);
  const [selectedAccountKeyIndex, setSelectedAccountKeyIndex] = useState<number | null>(null);
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [language, setLanguage] = useState<string | null>(null);

  async function createWalletDaemonSigner(serverUrl: string): Promise<WalletDaemonTariSigner> {
    const permissions = new TariPermissions().addPermission("Admin");
    const params: WalletDaemonFetchParameters = {
      permissions,
      serverUrl,
    };
    const walletDaemonProvider = await WalletDaemonTariSigner.buildFetchSigner(params);
    return walletDaemonProvider;
  }

  useEffect(() => {
    const initializeSigner = async () => {
      const walletDaemonSigner = await createWalletDaemonSigner("http://localhost:12011/json_rpc");
      const info = await walletDaemonSigner.getWalletInfo();
      setNetwork(parseNetwork(info.network));
      const account = await walletDaemonSigner.getAccount();
      setSigner(walletDaemonSigner);
      setSelectedAccountKeyIndex(account.account_id);
      setAccountAddress(account.address);
    };

    initializeSigner().catch(console.log);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<HostMessage>) => {
      if (event.data.type === "SET_THEME") {
        setTheme(event.data.payload.theme);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (event.data.type === "SET_LANGUAGE") {
        setLanguage(event.data.payload.language);
      }
    };

    window.addEventListener("message", handleMessage);
    window.postMessage({ type: "GET_INIT_CONFIG" }, "*");

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const getTransactionProps = useCallback(() => {
    if (!accountAddress || !network) {
      throw new Error("No connection");
    }
    const props: TransactionProps = {
      network,
      accountAddress,
      fee: 100,
    };
    return Promise.resolve(props);
  }, [accountAddress, network]);

  const parseNetwork = (networkName: string): TariNetwork => {
    switch (networkName.toLowerCase()) {
      case "mainnet":
        return TariNetwork.MainNet;
      case "stagenet":
        return TariNetwork.StageNet;
      case "nextnet":
        return TariNetwork.NextNet;
      case "localnet":
        return TariNetwork.LocalNet;
      case "igor":
        return TariNetwork.Igor;
      case "esmeralda":
        return TariNetwork.Esmeralda;
      default:
        return TariNetwork.LocalNet;
    }
  };

  async function waitForAnyTransactionResult(
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

  const executeTransaction = useCallback(
    async (transaction: UnsignedTransactionV1) => {
      if (!signer || selectedAccountKeyIndex === null) {
        throw new Error("No connection");
      }
      const submitTransactionRequest = buildTransactionRequest(transaction, selectedAccountKeyIndex);
      const response = await signer.submitTransaction(submitTransactionRequest);
      const result = await waitForAnyTransactionResult(signer, response.transaction_id);
      const succeeded = result.status === TransactionStatus.Accepted || result.status === TransactionStatus.DryRun;
      if (!succeeded) {
        throw new Error("Execution failed.");
      }
    },
    [signer, selectedAccountKeyIndex],
  );

  return (
    <>
      <QueryBuilder
        language={language ?? "en"}
        theme={theme ?? "dark"}
        getTransactionProps={getTransactionProps}
        executeTransaction={executeTransaction}
        allowLoadAndExportFlow
      />
    </>
  );
}

export default App;
