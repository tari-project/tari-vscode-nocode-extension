import {
  GetTransactionResultResponse,
  ListSubstatesResponse,
  Substate,
  TransactionStatus,
} from "@tari-project/tarijs-all";
import { TariConfigurationKey, TariNetwork, TariProviderType } from "@tari-project/tari-extension-common";
import { create } from "zustand";
import { DEFAULT_WALLET_DAEMON_ADDRESS } from "../constants";
import { createWalletDaemonSigner } from "../utils/signers";
import {
  SerializedTariStore,
  TariStore,
  TariStoreAction,
  TariStoreEphemeral,
  TransactionExecutionResult,
} from "./types";
import { persistStateMiddleware } from "./persist-state-middleware";
import { AccountInfo, SubstateType, TemplateDef } from "@tari-project/typescript-bindings";

const MAX_TRANSACTION_EXECUTION_RESULTS = 5;

export const useTariStore = create<TariStore & TariStoreEphemeral & TariStoreAction>()(
  persistStateMiddleware((set, get) => ({
    setVscode: (vscode) => {
      set(() => ({ vscode }));
    },
    setMessenger: (messenger) => {
      set(() => ({ messenger }));
    },
    setConfiguration: (configuration) => {
      set(() => ({ configuration }));
    },
    setSigner: (signer) => {
      set(() => ({ signer }));
    },
    setWalletInfo: (walletInfo) => {
      set(() => ({ walletInfo }));
    },
    setAccounts: (accounts) => {
      let selectedAccountKeyIndex = undefined;
      let selectedAccountAddress = undefined;
      if (accounts?.accounts && accounts.accounts.length > 0) {
        const defaultAccount = accounts.accounts.find((acc) => acc.account.is_default);
        selectedAccountKeyIndex = defaultAccount ? defaultAccount.account.key_index : undefined;
        selectedAccountAddress = extractComponentAddress(defaultAccount);
      }
      set(() => ({ accounts, selectedAccountKeyIndex, selectedAccountAddress }));
    },
    setSelectedAccountKeyIndex: (selectedAccountKeyIndex) => {
      const state = get();
      let selectedAccountAddress = undefined;
      if (state.accounts?.accounts && selectedAccountKeyIndex !== undefined) {
        const accInfo = state.accounts.accounts.find((acc) => acc.account.key_index === selectedAccountKeyIndex);
        selectedAccountAddress = extractComponentAddress(accInfo);
      }
      set(() => ({ selectedAccountKeyIndex, selectedAccountAddress }));
    },
    accountsActionsOpen: false,
    setAccountsActionsOpen: (accountsActionsOpen) => {
      set(() => ({ accountsActionsOpen }));
    },
    listSubstatesActionsOpen: false,
    setListSubstatesActionsOpen: (listSubstatesActionsOpen) => {
      set(() => ({ listSubstatesActionsOpen }));
    },
    substateDetailsActionsOpen: false,
    setSubstateDetailsActionsOpen: (substateDetailsActionsOpen) => {
      set(() => ({ substateDetailsActionsOpen }));
    },
    templateActionsOpen: false,
    setTemplateActionsOpen: (templateActionsOpen) => {
      set(() => ({ templateActionsOpen }));
    },
    transactionExecutionActionsOpen: false,
    setTransactionExecutionActionsOpen: (transactionExecutionActionsOpen) => {
      set(() => ({ transactionExecutionActionsOpen }));
    },
    closeAllActions: () => {
      get().setAccountsActionsOpen(false);
      get().setListSubstatesActionsOpen(false);
      get().setSubstateDetailsActionsOpen(false);
      get().setTemplateActionsOpen(false);
      get().setTransactionExecutionActionsOpen(false);
    },
    saveState: () => {
      const state = get();
      if (!state.vscode) {
        return;
      }
      const serializedState = {
        configuration: state.configuration,
        walletInfo: state.walletInfo,
        accounts: state.accounts,
        selectedAccountKeyIndex: state.selectedAccountKeyIndex,
        selectedAccountAddress: state.selectedAccountAddress,
        accountsActionsOpen: state.accountsActionsOpen,
        listSubstatesActionsOpen: state.listSubstatesActionsOpen,
        substateDetailsActionsOpen: state.substateDetailsActionsOpen,
        templateActionsOpen: state.templateActionsOpen,
        transactionExecutionActionsOpen: state.transactionExecutionActionsOpen,
        activeSigner:
          state.signer && state.configuration ? state.configuration[TariConfigurationKey.DefaultProvider] : undefined,
        listSubstatesState: state.listSubstatesState,
        substateDetailsState: state.substateDetailsState,
        templateState: state.templateState,
        transactionExecutionState: state.transactionExecutionState,
      } satisfies SerializedTariStore;
      state.vscode.setState(serializedState);
    },
    restoreState: async () => {
      const state = get();
      if (!state.vscode) {
        return;
      }
      const serializedState = state.vscode.getState();
      if (!serializedState) {
        return;
      }

      const signer =
        serializedState.activeSigner === TariProviderType.WalletDemon
          ? await createWalletDaemonSigner(
              serializedState.configuration?.[TariConfigurationKey.WalletDaemonAddress] ??
                DEFAULT_WALLET_DAEMON_ADDRESS,
            )
          : undefined;
      set(() => ({
        signer,
        configuration: serializedState.configuration,
        walletInfo: serializedState.walletInfo,
        accounts: serializedState.accounts,
        selectedAccountKeyIndex: serializedState.selectedAccountKeyIndex,
        selectedAccountAddress: serializedState.selectedAccountAddress,
        accountsActionsOpen: serializedState.accountsActionsOpen,
        listSubstatesActionsOpen: serializedState.listSubstatesActionsOpen,
        substateDetailsActionsOpen: serializedState.substateDetailsActionsOpen,
        templateActionsOpen: serializedState.templateActionsOpen,
        transactionExecutionActionsOpen: serializedState.transactionExecutionActionsOpen,
        listSubstatesState: serializedState.listSubstatesState,
        substateDetailsState: serializedState.substateDetailsState,
        templateState: serializedState.templateState,
        transactionExecutionState: serializedState.transactionExecutionState,
      }));
      get().saveState();
    },
    listSubstatesState: {},
    listSubstatesActions: {
      setSubstates: (substates?: ListSubstatesResponse) => {
        set((state) => ({ listSubstatesState: { ...state.listSubstatesState, substates } }));
      },
      setSubstateType: (substateType?: SubstateType) => {
        set((state) => ({ listSubstatesState: { ...state.listSubstatesState, substateType } }));
      },
      setTemplateAddress: (templateAddress?: string) => {
        set((state) => ({ listSubstatesState: { ...state.listSubstatesState, templateAddress } }));
      },
      setLimit: (limit?: number) => {
        set((state) => ({ listSubstatesState: { ...state.listSubstatesState, limit } }));
      },
      setOffset: (offset?: number) => {
        set((state) => ({ listSubstatesState: { ...state.listSubstatesState, offset } }));
      },
    },
    substateDetailsState: {},
    substateDetailsActions: {
      setSubstateId: (substateId?: string) => {
        set((state) => ({ substateDetailsState: { ...state.substateDetailsState, substateId } }));
      },
      setSubstate: (substate?: Substate) => {
        set((state) => ({ substateDetailsState: { ...state.substateDetailsState, substate } }));
      },
    },
    templateState: {},
    templateActions: {
      setTemplateAddress: (templateAddress?: string) => {
        set((state) => ({ templateState: { ...state.templateState, templateAddress } }));
      },
      setTemplateDef: (templateDef?: TemplateDef) => {
        set((state) => ({ templateState: { ...state.templateState, templateDef } }));
      },
    },
    transactionExecutionState: {},
    transactionExecutionAction: {
      setTransactionExecutions: (transactionExecutions?: TransactionExecutionResult[]) => {
        set((state) => ({ transactionExecutionState: { ...state.transactionExecutionState, transactionExecutions } }));
      },
      setOpenedTransactionResult: (openedTransactionResult?: GetTransactionResultResponse) => {
        set((state) => ({
          transactionExecutionState: { ...state.transactionExecutionState, openedTransactionResult },
        }));
      },
      addTransactionExecution: (result, maxResults) => {
        const dateTimestamp = Date.now();
        const succeeded = result.status === TransactionStatus.Accepted || result.status === TransactionStatus.DryRun;
        set((state) => {
          const newExecutions = [
            { dateTimestamp, succeeded, result },
            ...(state.transactionExecutionState.transactionExecutions ?? []),
          ];
          if (newExecutions.length > (maxResults ?? MAX_TRANSACTION_EXECUTION_RESULTS)) {
            newExecutions.pop();
          }
          return {
            transactionExecutionState: { ...state.transactionExecutionState, transactionExecutions: newExecutions },
          };
        });
      },
    },
    getNetworkName: () => {
      const state = get();
      if (!state.walletInfo) {
        return undefined;
      }

      switch (state.walletInfo.network.toLowerCase()) {
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
      }

      return undefined;
    },
  })),
);

const extractComponentAddress = (account?: AccountInfo): string | undefined => {
  const address = account ? account.account.address : undefined;
  if (typeof address === "string") {
    return address;
  }
  return address && "Component" in address ? address.Component : undefined;
};
