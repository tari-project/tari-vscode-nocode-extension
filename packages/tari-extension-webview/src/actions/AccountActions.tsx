import { TariSigner } from "@tari-project/tarijs-all";
import { VscodeCollapsible, VscodeDivider, VscodeIcon, VscodeProgressRing } from "@vscode-elements/react-elements";
import * as ve from "@vscode-elements/elements";
import { useCollapsibleToggle } from "../hooks/collapsible-toggle";
import { useTariStore } from "../store/tari-store";
import { useEffect, useRef, useState } from "react";
import { JsonOutline } from "../json-parser/JsonOutline";
import JsonOutlineTree from "../components/JsonOutlineTree";
import { JsonDocument } from "../json-parser/JsonDocument";
import { ACCOUNT_KNOWN_PARTS } from "../json-parser/known-parts/account";
import { JsonOutlineItem } from "@tari-project/tari-extension-common";

interface AccountActionsProps {
  signer: TariSigner;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

function AccountActions({ signer, open, onToggle }: AccountActionsProps) {
  const refreshRef = useRef<ve.VscodeIcon | null>(null);
  const messenger = useTariStore((state) => state.messenger);
  const accountData = useTariStore((state) => state.accountData);
  const setAccountData = useTariStore((state) => state.setAccountData);
  const [jsonDocument, setJsonDocument] = useState<JsonDocument | undefined>(undefined);
  const [outlineItems, setOutlineItems] = useState<JsonOutlineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [shouldShowDocument, setShouldShowDocument] = useState(false);

  const handleRefreshClick = (event: MouseEvent) => {
    event.stopPropagation();
    void fetchAccountInformation();
  };

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
  });

  useEffect(() => {
    if (!open || !accountData || !messenger) {
      return;
    }
    const document = new JsonDocument("Account", accountData);
    setJsonDocument(document);
    const outline = new JsonOutline(document, ACCOUNT_KNOWN_PARTS);
    setOutlineItems(outline.items);

    if (shouldShowDocument) {
      messenger
        .send("showJsonOutline", {
          id: document.id,
          json: document.jsonString,
          outlineItems: outline.items,
        })
        .then(() => {
          setShouldShowDocument(false);
        })
        .catch(console.error);
    }
  }, [open, accountData, messenger, shouldShowDocument, setShouldShowDocument]);

  const fetchAccountInformation = async () => {
    if (messenger) {
      setLoading(true);
      try {
        const account = await signer.getAccount();
        setAccountData(account);
        setShouldShowDocument(true);
      } catch (error: unknown) {
        await messenger.send("showError", { message: "Failed to get account info", detail: String(error) });
      }
      setLoading(false);
    }
  };

  const handleAccountToggled = async (open: boolean) => {
    if (open && !jsonDocument) {
      await fetchAccountInformation();
    }
  };

  const collapsibleRef = useCollapsibleToggle((open) => {
    if (onToggle) {
      onToggle(open);
    }
    void handleAccountToggled(open);
  });

  return (
    <>
      <VscodeCollapsible ref={collapsibleRef} open={open ?? false} title="Account">
        <VscodeIcon ref={refreshRef} name="refresh" id="btn-refresh" actionIcon title="Refresh" slot="actions" />
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
