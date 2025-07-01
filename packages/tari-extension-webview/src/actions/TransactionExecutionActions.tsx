import { useCollapsibleToggle } from "../hooks/collapsible-toggle";
import {
  VscodeButton,
  VscodeCollapsible,
  VscodeDivider,
  VscodeIcon,
  VscodeLabel,
  VscodeTable,
  VscodeTableBody,
  VscodeTableCell,
  VscodeTableHeader,
  VscodeTableHeaderCell,
  VscodeTableRow,
} from "@vscode-elements/react-elements";
import { useTariStore } from "../store/tari-store";
import { useEffect, useState } from "react";
import { JsonDocument } from "../json-parser/JsonDocument";
import JsonOutlineTree from "../components/JsonOutlineTree";
import { JsonOutlineItem } from "@tari-project/tari-extension-common";
import { GetTransactionResultResponse } from "@tari-project/tarijs-all";
import { JsonOutline } from "../json-parser/JsonOutline";
import { TRANSACTION_EXECUTION_PARTS } from "../json-parser/known-parts/transaction-execution";
import { TariStore, TariStoreAction } from "../store/types";
import { useShallow } from "zustand/shallow";

interface TransactionExecutionActionsProps {
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

const selector = (state: TariStore & TariStoreAction) => ({
  transactionExecutions: state.transactionExecutionState.transactionExecutions,
  openedTransactionResult: state.transactionExecutionState.openedTransactionResult,
  setOpenedTransactionResult: state.transactionExecutionAction.setOpenedTransactionResult,
});

function TransactionExecutionActions({ open, onToggle }: TransactionExecutionActionsProps) {
  const collapsibleRef = useCollapsibleToggle(onToggle ?? (() => undefined));
  const { transactionExecutions, openedTransactionResult, setOpenedTransactionResult } = useTariStore(
    useShallow(selector),
  );
  const messenger = useTariStore((state) => state.messenger);
  const [jsonDocument, setJsonDocument] = useState<JsonDocument | undefined>(undefined);
  const [outlineItems, setOutlineItems] = useState<JsonOutlineItem[]>([]);
  const [shouldShowDocument, setShouldShowDocument] = useState(false);
  const hasItems = transactionExecutions && transactionExecutions.length > 0;

  useEffect(() => {
    if (!open || !openedTransactionResult || !messenger) {
      return;
    }
    const json = openedTransactionResult.result;
    if (!json) {
      return;
    }
    const document = new JsonDocument("Execution result", json);
    setJsonDocument(document);
    const outline = new JsonOutline(document, TRANSACTION_EXECUTION_PARTS);
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
  }, [open, openedTransactionResult, messenger, shouldShowDocument, setShouldShowDocument]);

  const handleLoadTransaction = (result: GetTransactionResultResponse) => {
    setOpenedTransactionResult(result);
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

  return (
    <>
      <VscodeCollapsible ref={collapsibleRef} open={open ?? false} title="Execution Results">
        <div>
          <div style={{ marginLeft: "10px" }}>
            <VscodeDivider />
            {!hasItems && <VscodeLabel>No Items</VscodeLabel>}
            {hasItems && (
              <VscodeTable
                key={transactionExecutions[0].dateTimestamp.toString()}
                resizable={true}
                responsive={true}
                borderedColumns={true}
                borderedRows={true}
                zebra={true}
                columns={["60px", "auto", "70px", "70px"]}
              >
                <VscodeTableHeader>
                  <VscodeTableHeaderCell>No.</VscodeTableHeaderCell>
                  <VscodeTableHeaderCell>Date</VscodeTableHeaderCell>
                  <VscodeTableHeaderCell>Success</VscodeTableHeaderCell>
                  <VscodeTableHeaderCell></VscodeTableHeaderCell>
                </VscodeTableHeader>
                <VscodeTableBody>
                  {transactionExecutions.map((row, idx) => (
                    <VscodeTableRow key={row.dateTimestamp.toString()}>
                      <VscodeTableCell>{idx + 1}</VscodeTableCell>
                      <VscodeTableCell>{new Date(row.dateTimestamp).toLocaleString()}</VscodeTableCell>
                      <VscodeTableCell>
                        {row.succeeded ? (
                          <VscodeIcon name="check"></VscodeIcon>
                        ) : (
                          <VscodeIcon name="error"></VscodeIcon>
                        )}
                      </VscodeTableCell>
                      <VscodeTableCell>
                        <VscodeButton
                          onClick={() => {
                            handleLoadTransaction(row.result);
                          }}
                        >
                          Load
                        </VscodeButton>
                      </VscodeTableCell>
                    </VscodeTableRow>
                  ))}
                </VscodeTableBody>
              </VscodeTable>
            )}
            {jsonDocument && (
              <>
                <VscodeDivider />
                <JsonOutlineTree
                  items={outlineItems}
                  onSelect={(item) => {
                    handleItemSelect(item).catch(console.log);
                  }}
                />
                <VscodeDivider />
              </>
            )}
          </div>
        </div>
      </VscodeCollapsible>
    </>
  );
}

export default TransactionExecutionActions;
