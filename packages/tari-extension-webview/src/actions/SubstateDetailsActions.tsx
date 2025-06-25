import { TariSigner } from "@tari-project/tarijs-all";
import { useTariStore } from "../store/tari-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { JsonOutlineItem } from "@tari-project/tari-extension-common";
import { JsonDocument } from "../json-parser/JsonDocument";
import {
  VscodeButton,
  VscodeCollapsible,
  VscodeDivider,
  VscodeFormContainer,
  VscodeFormGroup,
  VscodeLabel,
  VscodeProgressRing,
  VscodeTextfield,
} from "@vscode-elements/react-elements";
import * as ve from "@vscode-elements/elements";
import JsonOutlineTree from "../components/JsonOutlineTree";
import { JsonOutline } from "../json-parser/JsonOutline";
import { SUBSTATE_DETAILS_PARTS } from "../json-parser/known-parts/substate-details";
import { useCollapsibleToggle } from "../hooks/collapsible-toggle";
import { useEnterKey } from "../hooks/textfield-enter";
import { TariStore, TariStoreAction } from "../store/types";
import { useShallow } from "zustand/shallow";

interface SubstateDetailsActionsProps {
  signer: TariSigner;
  substateId?: string;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

const selector = (state: TariStore & TariStoreAction) => ({
  substateId: state.substateDetailsState.substateId,
  substate: state.substateDetailsState.substate,
  setSubstateId: state.substateDetailsActions.setSubstateId,
  setSubstate: state.substateDetailsActions.setSubstate,
});

function SubstateDetailsActions({
  signer,
  substateId: externalSubstateId,
  open,
  onToggle,
}: SubstateDetailsActionsProps) {
  const messenger = useTariStore((state) => state.messenger);
  const { substateId, substate, setSubstateId, setSubstate } = useTariStore(useShallow(selector));
  const [jsonDocument, setJsonDocument] = useState<JsonDocument | undefined>(undefined);
  const [outlineItems, setOutlineItems] = useState<JsonOutlineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const substateIdRef = useRef<ve.VscodeTextfield>(null);
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
    if (!open || !substate || !messenger) {
      return;
    }
    const document = new JsonDocument("Substate details", substate);
    setJsonDocument(document);
    const outline = new JsonOutline(document, SUBSTATE_DETAILS_PARTS);
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
  }, [open, substate, messenger, shouldShowDocument, setShouldShowDocument]);

  const fetchSubstateDetails = useCallback(
    async (substateIdToFetch: string) => {
      if (messenger) {
        setLoading(true);
        try {
          const details = await signer.getSubstate(substateIdToFetch);
          setSubstate(details);
          setShouldShowDocument(true);
        } catch (error: unknown) {
          await messenger.send("showError", { message: "Failed to fetch substate details", detail: String(error) });
        }
        setLoading(false);
      }
    },
    [messenger, signer, setSubstate],
  );

  const handleEnterPressed = useCallback(() => {
    if (substateId) {
      fetchSubstateDetails(substateId).catch(console.log);
    }
  }, [substateId, fetchSubstateDetails]);

  useEnterKey(substateIdRef, handleEnterPressed);

  useEffect(() => {
    if (externalSubstateId !== undefined) {
      setSubstateId(externalSubstateId);
      void fetchSubstateDetails(externalSubstateId);
    }
  }, [externalSubstateId, fetchSubstateDetails, setSubstateId]);

  return (
    <>
      <VscodeCollapsible ref={collapsibleRef} open={open ?? false} title="Substate Details">
        <VscodeFormContainer>
          <VscodeFormGroup>
            <VscodeLabel htmlFor="substateId">Substate ID</VscodeLabel>
            <VscodeTextfield
              ref={substateIdRef}
              id="substateId"
              value={substateId ?? ""}
              onInput={(event) => {
                const target = event.target as ve.VscodeTextfield;
                setSubstateId(target.value);
              }}
            />
          </VscodeFormGroup>
          <VscodeButton
            icon="code-oss"
            onClick={() => {
              if (substateId) {
                void fetchSubstateDetails(substateId);
              }
            }}
          >
            Fetch
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
              />
            </div>
            <VscodeDivider />
          </div>
        )}
      </VscodeCollapsible>
    </>
  );
}

export default SubstateDetailsActions;
