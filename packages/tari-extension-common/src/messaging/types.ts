import { TariConfiguration, TariNetwork } from "../configuration/tari-configuration";
import { JsonOutlineItem } from "../outline";

export interface TariFlowNodeDetails {
  template: Record<string, unknown>;
  templateAddress: string;
  functionName: string;
}

export interface ExecuteTransactionBaseRequest {
  transaction: Record<string, unknown>;
}

export interface ExecuteTransactionRequest extends ExecuteTransactionBaseRequest {
  network: TariNetwork;
}

export interface ShowGeneratedCodeRequest {
  code: string;
  type: GeneratedCodeType;
}

export interface WebViewMessages {
  /** Webview -> Extension */
  showError: {
    request: {
      message: string;
      detail?: string;
    };
    response: undefined;
  };
  getConfiguration: {
    request: undefined;
    response: TariConfiguration;
  };
  setWalletDaemonAddress: {
    request: TariConfiguration["walletDaemonAddress"];
    response: undefined;
  };
  setWalletConnectProjectId: {
    request: TariConfiguration["walletConnectProjectId"];
    response: undefined;
  };
  setDefaultProvider: {
    request: TariConfiguration["defaultProvider"];
    response: undefined;
  };
  setNetwork: {
    request: TariConfiguration["network"];
    response: undefined;
  };
  showLongOperation: {
    request: {
      title: string;
      cancellable: boolean;
    };
    response: {
      cancelled: boolean;
    };
  };
  updateLongOperation: {
    request: {
      increment: number;
      message: string;
    };
    response: undefined;
  };
  endLongOperation: {
    request: undefined;
    response: undefined;
  };
  showJsonOutline: {
    request: {
      id: string;
      json: string;
      outlineItems: JsonOutlineItem[];
      selected?: JsonOutlineItem;
    };
    response: undefined;
  };
  newTariFlow: {
    request: undefined;
    response: undefined;
  };

  addTariFlowNode: {
    request: TariFlowNodeDetails;
    response: undefined;
  };

  /** Extension -> Webview */
  configurationChanged: {
    request: TariConfiguration;
    response: undefined;
  };

  getAccountAddress: {
    request: undefined;
    response: string;
  };

  executeTransaction: {
    request: ExecuteTransactionRequest;
    response: undefined;
  };
}

export type Theme = "dark" | "light";

export interface TransactionProps {
  network: TariNetwork;
  accountAddress: string;
  fee: number;
}

export interface TariFlowMessages {
  /** Tari Flow -> Extension */
  ready: {
    request: undefined;
    response: undefined;
  };

  documentChanged: {
    request: undefined;
    response: undefined;
  };

  getTransactionProps: {
    request: undefined;
    response: TransactionProps;
  };

  executeTransaction: {
    request: ExecuteTransactionBaseRequest;
    response: undefined;
  };

  showGeneratedCode: {
    request: ShowGeneratedCodeRequest;
    response: undefined;
  };

  /** Extension -> Tari Flow */
  init: {
    request: {
      theme: Theme;
      data: string;
      editable: boolean;
    };
    response: undefined;
  };

  setTheme: {
    request: Theme;
    response: undefined;
  };

  getData: {
    request: undefined;
    response: string;
  };

  addNode: {
    request: TariFlowNodeDetails;
    response: undefined;
  };
}

export enum GeneratedCodeType {
  Typescript = "typescript",
  Javascript = "javascript",
}
