import { TariSigner } from "@tari-project/tarijs-all";
import {
  VscodeCollapsible,
  VscodeDivider,
  VscodeFormContainer,
  VscodeFormGroup,
  VscodeIcon,
  VscodeLabel,
  VscodeOption,
  VscodeProgressRing,
  VscodeSingleSelect,
  VscodeTextfield,
} from "@vscode-elements/react-elements";
import * as ve from "@vscode-elements/elements";
import { useCollapsibleToggle } from "../hooks/collapsible-toggle";
import { useTariStore } from "../store/tari-store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JsonOutline } from "../json-parser/JsonOutline";
import JsonOutlineTree from "../components/JsonOutlineTree";
import { JsonDocument } from "../json-parser/JsonDocument";
import { ACCOUNT_KNOWN_PARTS } from "../json-parser/known-parts/account";
import { JsonOutlineItem } from "@tari-project/tari-extension-common";
import { AccountGetResponse } from "@tari-project/typescript-bindings";

interface AccountActionsProps {
  signer: TariSigner;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

function AccountActions({ signer, open, onToggle }: AccountActionsProps) {
  const refreshRef = useRef<ve.VscodeIcon | null>(null);
  const messenger = useTariStore((state) => state.messenger);
  const getNetworkName = useTariStore((state) => state.getNetworkName);
  const accounts = useTariStore((state) => state.accounts);
  const setSelectedAccountKeyIndex = useTariStore((state) => state.setSelectedAccountKeyIndex);
  const selectedAccountKeyIndex = useTariStore((state) => state.selectedAccountKeyIndex);
  const selectedAccountAddress = useTariStore((state) => state.selectedAccountAddress);

  const [loading, setLoading] = useState(false);
  const [shouldShowDocument, setShouldShowDocument] = useState(false);
  const [accountData, setAccountData] = useState<AccountGetResponse | undefined>(undefined);

  const jsonDocument = useMemo(() => {
    if (!accountData) return undefined;
    return new JsonDocument("Account", accountData);
  }, [accountData]);

  const outlineItems = useMemo(() => {
    if (!jsonDocument) return [];
    const outline = new JsonOutline(jsonDocument, ACCOUNT_KNOWN_PARTS);
    return outline.items;
  }, [jsonDocument]);

  const fetchAccountInformation = useCallback(async () => {
    if (messenger && selectedAccountAddress) {
      setLoading(true);
      try {
        const account = await signer.getAccountByAddress(selectedAccountAddress);
        setAccountData(account);
        setShouldShowDocument(true);
      } catch (error: unknown) {
        await messenger.send("showError", { message: "Failed to get account info", detail: String(error) });
      }
      setLoading(false);
    }
  }, [messenger, selectedAccountAddress, signer]);

  const handleRefreshClick = useCallback(
    (event: Event) => {
      event.stopPropagation();
      void fetchAccountInformation();
    },
    [fetchAccountInformation],
  );

  const handleItemSelect = async (item: JsonOutlineItem) => {
    if (messenger && jsonDocument) {
      await messenger.send("showJsonOutline", {
        id: jsonDocument.id,
        json: jsonDocument.jsonString,
        outlineItems,
        selected: item,
      });
    }
  };

  useEffect(() => {
    if (!refreshRef.current) return;
    const refreshElement = refreshRef.current as HTMLElement;

    refreshElement.addEventListener("click", handleRefreshClick);
    return () => {
      refreshElement.removeEventListener("click", handleRefreshClick);
    };
  }, [handleRefreshClick]);

  useEffect(() => {
    if (shouldShowDocument && jsonDocument && messenger) {
      messenger
        .send("showJsonOutline", {
          id: jsonDocument.id,
          json: jsonDocument.jsonString,
          outlineItems: outlineItems,
        })
        .then(() => {
          setShouldShowDocument(false);
        })
        .catch(console.error);
    }
  }, [shouldShowDocument, jsonDocument, outlineItems, messenger]);

  const collapsibleRef = useCollapsibleToggle((open) => {
    if (onToggle) {
      onToggle(open);
    }
  });

  const handleAccountChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const selectedKeyIndex = Number(target.value);
    setSelectedAccountKeyIndex(selectedKeyIndex);
  };

  return (
    <>
      <VscodeCollapsible ref={collapsibleRef} open={open ?? false} title="Account" className="list-overflow">
        <VscodeIcon ref={refreshRef} name="refresh" id="btn-refresh" actionIcon title="Refresh" slot="actions" />
        <VscodeFormContainer>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="network">Network</VscodeLabel>
            <VscodeTextfield id="network" value={getNetworkName()} readonly />
          </VscodeFormGroup>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="account">Account</VscodeLabel>
            <VscodeSingleSelect
              id="account"
              value={selectedAccountKeyIndex !== undefined ? String(selectedAccountKeyIndex) : undefined}
              onChange={handleAccountChange}
            >
              {accounts?.accounts.map((accInfo) => {
                const displayName = accInfo.account.name ?? `Account ${String(accInfo.account.key_index)}`;
                return (
                  <VscodeOption key={accInfo.account.key_index} value={String(accInfo.account.key_index)}>
                    {displayName}
                  </VscodeOption>
                );
              })}
            </VscodeSingleSelect>
          </VscodeFormGroup>
        </VscodeFormContainer>
        {loading && <VscodeProgressRing />}
        {!loading && jsonDocument && (
          <div>
            <VscodeDivider />
            <div style={{ marginLeft: "10px" }}>
              <JsonOutlineTree
                items={outlineItems}
                onSelect={(item) => {
                  handleItemSelect(item).catch(console.log);
                }}
              />
            </div>
            <VscodeDivider />
          </div>
        )}
      </VscodeCollapsible>
    </>
  );
}

export default AccountActions;
