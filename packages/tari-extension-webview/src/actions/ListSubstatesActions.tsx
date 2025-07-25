import { TariSigner } from "@tari-project/tarijs-all";
import {
  VscodeFormGroup,
  VscodeCollapsible,
  VscodeFormContainer,
  VscodeLabel,
  VscodeTextfield,
  VscodeSingleSelect,
  VscodeOption,
  VscodeButton,
  VscodeProgressRing,
  VscodeDivider,
} from "@vscode-elements/react-elements";
import * as ve from "@vscode-elements/elements";
import "./list-overflow.css";
import { useTariStore } from "../store/tari-store";
import { JsonDocument } from "../json-parser/JsonDocument";
import { JsonOutlineItem } from "@tari-project/tari-extension-common";
import { useEffect, useState } from "react";
import JsonOutlineTree from "../components/JsonOutlineTree";
import { JsonOutline } from "../json-parser/JsonOutline";
import { SUBSTATE_LIST_PARTS } from "../json-parser/known-parts/substate-list";
import { SubstateType } from "@tari-project/typescript-bindings";
import { useCollapsibleToggle } from "../hooks/collapsible-toggle";
import { TariStore, TariStoreAction } from "../store/types";
import { useShallow } from "zustand/shallow";

const DEFAULT_LIMIT = 15;
const DEFAULT_OFFSET = 0;

const selector = (state: TariStore & TariStoreAction) => ({
  substates: state.listSubstatesState.substates,
  substateType: state.listSubstatesState.substateType,
  templateAddress: state.listSubstatesState.templateAddress,
  limit: state.listSubstatesState.limit,
  offset: state.listSubstatesState.offset,
  setSubstates: state.listSubstatesActions.setSubstates,
  setSubstateType: state.listSubstatesActions.setSubstateType,
  setTemplateAddress: state.listSubstatesActions.setTemplateAddress,
  setLimit: state.listSubstatesActions.setLimit,
  setOffset: state.listSubstatesActions.setOffset,
});

interface ListSubstatesActionsProps {
  signer: TariSigner;
  onViewDetails: (item: JsonOutlineItem) => void;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

function ListSubstatesActions({ signer, onViewDetails, open, onToggle }: ListSubstatesActionsProps) {
  const messenger = useTariStore((state) => state.messenger);
  const {
    substates,
    substateType,
    templateAddress,
    limit,
    offset,
    setSubstates,
    setSubstateType,
    setTemplateAddress,
    setLimit,
    setOffset,
  } = useTariStore(useShallow(selector));
  const [jsonDocument, setJsonDocument] = useState<JsonDocument | undefined>(undefined);
  const [outlineItems, setOutlineItems] = useState<JsonOutlineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [shouldShowDocument, setShouldShowDocument] = useState(false);

  const collapsibleRef = useCollapsibleToggle(onToggle ?? (() => undefined));

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
    if (!open || !substates || !messenger) {
      return;
    }
    const document = new JsonDocument("Substates", substates);
    setJsonDocument(document);
    const outline = new JsonOutline(document, SUBSTATE_LIST_PARTS);
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
  }, [open, substates, messenger, shouldShowDocument, setShouldShowDocument]);

  const fetchSubstateList = async () => {
    if (messenger) {
      setLoading(true);
      try {
        const request = {
          filter_by_template: templateAddress?.length ? templateAddress : null,
          filter_by_type: substateType ?? null,
          limit: limit ?? DEFAULT_LIMIT,
          offset: offset ?? DEFAULT_OFFSET,
        };
        const substates = await signer.listSubstates(request);
        setSubstates(substates);
        setShouldShowDocument(true);
      } catch (error: unknown) {
        await messenger.send("showError", { message: "Failed to list substates", detail: String(error) });
      }
      setLoading(false);
    }
  };

  return (
    <>
      <VscodeCollapsible ref={collapsibleRef} open={open ?? false} title="List Substates" className="list-overflow">
        <VscodeFormContainer>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="substateType">Substate Type</VscodeLabel>
            <VscodeSingleSelect
              id="substateType"
              value={substateType}
              onChange={(event) => {
                const target = event.target as ve.VscodeSingleSelect;
                setSubstateType(target.value.length ? (target.value as SubstateType) : undefined);
              }}
            >
              <VscodeOption></VscodeOption>
              <VscodeOption description="Component" value="Component">
                Component
              </VscodeOption>
              <VscodeOption description="Resource" value="Resource">
                Resource
              </VscodeOption>
              <VscodeOption description="Vault" value="Vault">
                Vault
              </VscodeOption>
              <VscodeOption description="Template" value="Template">
                Template
              </VscodeOption>
              <VscodeOption description="TransactionReceipt" value="TransactionReceipt">
                TransactionReceipt
              </VscodeOption>
              <VscodeOption description="NonFungible" value="NonFungible">
                NonFungible
              </VscodeOption>
              <VscodeOption description="NonFungibleIndex" value="NonFungibleIndex">
                NonFungibleIndex
              </VscodeOption>
              <VscodeOption description="ValidatorFeePool" value="ValidatorFeePool">
                ValidatorFeePool
              </VscodeOption>
              <VscodeOption description="UnclaimedConfidentialOutput" value="UnclaimedConfidentialOutput">
                UnclaimedConfidentialOutput
              </VscodeOption>
            </VscodeSingleSelect>
          </VscodeFormGroup>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="templateAddress">Template Address</VscodeLabel>
            <VscodeTextfield
              id="templateAddress"
              value={templateAddress ?? ""}
              onInput={(event) => {
                const target = event.target as ve.VscodeTextfield;
                setTemplateAddress(target.value);
              }}
            />
          </VscodeFormGroup>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="limit">Limit</VscodeLabel>
            <VscodeTextfield
              id="limit"
              type="number"
              min={1}
              pattern="\d+"
              value={limit ? limit.toString() : ""}
              onInput={(event) => {
                const target = event.target as ve.VscodeTextfield;
                setLimit(getNumber(target.value));
              }}
            />
          </VscodeFormGroup>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="offset">Offset</VscodeLabel>
            <VscodeTextfield
              id="offset"
              type="number"
              min={0}
              pattern="\d+"
              value={offset ? offset.toString() : ""}
              onInput={(event) => {
                const target = event.target as ve.VscodeTextfield;
                setOffset(getNumber(target.value));
              }}
            />
          </VscodeFormGroup>
          <VscodeButton
            icon="list-unordered"
            onClick={() => {
              void fetchSubstateList();
            }}
          >
            List
          </VscodeButton>
          <VscodeDivider />
        </VscodeFormContainer>

        {loading && <VscodeProgressRing />}
        {!loading && jsonDocument && (
          <div>
            <div style={{ marginLeft: "10px" }}>
              <JsonOutlineTree
                items={outlineItems}
                onSelect={(item) => {
                  handleItemSelect(item).catch(console.log);
                }}
                onAction={(_actionId, item) => {
                  onViewDetails(item);
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

function getNumber(text: string): number | undefined {
  const n = parseInt(text);
  return Number.isNaN(n) ? undefined : n;
}

export default ListSubstatesActions;
