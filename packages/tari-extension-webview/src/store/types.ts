import { AccountData, ListSubstatesResponse, Substate, TariSigner, TransactionResult } from "@tari-project/tarijs-all";
import { SubstateType, TemplateDef } from "@tari-project/typescript-bindings";
import { Messenger, TariConfiguration, TariProviderType, WebViewMessages } from "tari-extension-common";
import { WebviewApi } from "vscode-webview";

export interface TransactionExecutionResult {
  dateTimestamp: number;
  succeeded: boolean;
  result: TransactionResult;
}

export interface TariStoreEphemeral {
  vscode?: WebviewApi<SerializedTariStore>;
  messenger?: Messenger<WebViewMessages>;
  signer?: TariSigner;
}

export interface ListSubstatesState {
  substates?: ListSubstatesResponse;
  substateType?: SubstateType;
  templateAddress?: string;
  limit?: number;
  offset?: number;
}

export interface ListSubstatesAction {
  setSubstates: (substates?: ListSubstatesResponse) => void;
  setSubstateType: (subsateType?: SubstateType) => void;
  setTemplateAddress: (templateAddress?: string) => void;
  setLimit: (limit?: number) => void;
  setOffset: (offset?: number) => void;
}

export interface SubstateDetailsState {
  substateId?: string;
  substate?: Substate;
}

export interface SubstateDetailsAction {
  setSubstateId: (substateId?: string) => void;
  setSubstate: (substate?: Substate) => void;
}

export interface TemplateState {
  templateAddress?: string;
  templateDef?: TemplateDef;
}

export interface TemplateAction {
  setTemplateAddress: (templateAddress?: string) => void;
  setTemplateDef: (templateDef?: TemplateDef) => void;
}

export interface TransactionExecutionState {
  transactionExecutions?: TransactionExecutionResult[];
  openedTransactionResult?: TransactionResult;
}

export interface TransactionExecutionAction {
  addTransactionExecution: (result: TransactionResult, maxResults?: number) => void;
  setTransactionExecutions: (transactionExecutions?: TransactionExecutionResult[]) => void;
  setOpenedTransactionResult: (openedTransactionResult?: TransactionResult) => void;
}

export interface TariStore {
  configuration?: TariConfiguration;
  accountData?: AccountData;
  accountsActionsOpen: boolean;
  listSubstatesActionsOpen: boolean;
  substateDetailsActionsOpen: boolean;
  templateActionsOpen: boolean;
  transactionExecutionActionsOpen: boolean;
  listSubstatesState: ListSubstatesState;
  substateDetailsState: SubstateDetailsState;
  templateState: TemplateState;
  transactionExecutionState: TransactionExecutionState;
}

export type SerializedTariStore = TariStore & {
  activeSigner?: TariProviderType;
};

export interface TariStoreAction {
  setVscode: (vscode: TariStoreEphemeral["vscode"]) => void;
  setMessenger: (vscode: TariStoreEphemeral["messenger"]) => void;
  setConfiguration: (vscode: TariStore["configuration"]) => void;
  setSigner: (vscode: TariStoreEphemeral["signer"]) => void;
  setAccountData: (vscode: TariStore["accountData"]) => void;
  setAccountsActionsOpen: (vscode: TariStore["accountsActionsOpen"]) => void;
  setListSubstatesActionsOpen: (vscode: TariStore["listSubstatesActionsOpen"]) => void;
  setSubstateDetailsActionsOpen: (vscode: TariStore["substateDetailsActionsOpen"]) => void;
  setTemplateActionsOpen: (vscode: TariStore["templateActionsOpen"]) => void;
  setTransactionExecutionActionsOpen: (vscode: TariStore["transactionExecutionActionsOpen"]) => void;
  closeAllActions: () => void;
  saveState: () => void;
  restoreState: () => Promise<void>;
  listSubstatesActions: ListSubstatesAction;
  substateDetailsActions: SubstateDetailsAction;
  templateActions: TemplateAction;
  transactionExecutionAction: TransactionExecutionAction;
}
