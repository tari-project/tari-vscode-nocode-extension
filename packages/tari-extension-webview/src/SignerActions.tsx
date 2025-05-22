import { TariSigner } from "@tari-project/tarijs-all";
import { VscodeDivider } from "@vscode-elements/react-elements";
import AccountActions from "./actions/AccountActions";
import ListSubstatesActions from "./actions/ListSubstatesActions";
import SubstateDetailsActions from "./actions/SubstateDetailsActions";
import { useState } from "react";
import TemplateActions from "./actions/TemplateActions";
import TransactionExecutionActions from "./actions/TransactionExecutionActions";
import { useTariStore } from "./store/tari-store";
import { TariStore, TariStoreAction } from "./store/types";
import { useShallow } from "zustand/shallow";

const selector = (state: TariStore & TariStoreAction) => ({
  accountsActionsOpen: state.accountsActionsOpen,
  listSubstatesActionsOpen: state.listSubstatesActionsOpen,
  substateDetailsActionsOpen: state.substateDetailsActionsOpen,
  templateActionsOpen: state.templateActionsOpen,
  transactionExecutionActionsOpen: state.transactionExecutionActionsOpen,
  setAccountsActionsOpen: state.setAccountsActionsOpen,
  setListSubstatesActionsOpen: state.setListSubstatesActionsOpen,
  setSubstateDetailsActionsOpen: state.setSubstateDetailsActionsOpen,
  setTemplateActionsOpen: state.setTemplateActionsOpen,
  setTransactionExecutionActionsOpen: state.setTransactionExecutionActionsOpen,
  closeAllActions: state.closeAllActions,
});

interface SignerActionsProps {
  signer: TariSigner;
}

function SignerActions({ signer }: SignerActionsProps) {
  const [substateId, setSubstateId] = useState<string | undefined>(undefined);
  const {
    accountsActionsOpen,
    listSubstatesActionsOpen,
    substateDetailsActionsOpen,
    templateActionsOpen,
    transactionExecutionActionsOpen,
    setAccountsActionsOpen,
    setListSubstatesActionsOpen,
    setSubstateDetailsActionsOpen,
    setTemplateActionsOpen,
    setTransactionExecutionActionsOpen,
    closeAllActions,
  } = useTariStore(useShallow(selector));

  return (
    <>
      <VscodeDivider />
      <AccountActions signer={signer} open={accountsActionsOpen} onToggle={setAccountsActionsOpen} />
      <ListSubstatesActions
        signer={signer}
        onViewDetails={(item) => {
          if (item.value) {
            setSubstateId(item.value as string);
            closeAllActions();
            setSubstateDetailsActionsOpen(true);
          }
        }}
        open={listSubstatesActionsOpen}
        onToggle={setListSubstatesActionsOpen}
      />
      <SubstateDetailsActions
        signer={signer}
        substateId={substateId}
        open={substateDetailsActionsOpen}
        onToggle={setSubstateDetailsActionsOpen}
      />
      <TemplateActions signer={signer} open={templateActionsOpen} onToggle={setTemplateActionsOpen} />
      <TransactionExecutionActions
        open={transactionExecutionActionsOpen}
        onToggle={setTransactionExecutionActionsOpen}
      />
    </>
  );
}

export default SignerActions;
