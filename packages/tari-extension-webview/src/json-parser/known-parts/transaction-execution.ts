import { KnownJsonPart } from "../JsonOutline";
import { getPropertyDetails } from "../tree-node-helpers";

const events: KnownJsonPart = {
  path: ["events"],
  getOutlineItem: () => {
    return {
      title: "Events",
      icon: "symbol-event",
    };
  },
};

const executionResults: KnownJsonPart = {
  path: ["execution_results"],
  getOutlineItem: () => {
    return {
      title: "Execution Results",
      icon: "checklist",
    };
  },
};

const feeReceipt: KnownJsonPart = {
  path: ["fee_receipt"],
  getOutlineItem: () => {
    return {
      title: "Fees",
      open: true,
      icon: "credit-card",
    };
  },
};

const feeRequested: KnownJsonPart = {
  path: ["fee_receipt", "total_fee_payment"],
  getOutlineItem: (node) => {
    const property = node.parent;
    const propertyDetails = getPropertyDetails(property);
    const fee = propertyDetails?.value as number | undefined;
    if (fee == null) {
      return undefined;
    }
    return {
      title: "Fee Payment",
      details: fee.toString(),
    };
  },
};

const feePaid: KnownJsonPart = {
  path: ["fee_receipt", "total_fees_paid"],
  getOutlineItem: (node) => {
    const property = node.parent;
    const propertyDetails = getPropertyDetails(property);
    const fee = propertyDetails?.value as number | undefined;
    if (fee == null) {
      return undefined;
    }
    return {
      title: "Fee Paid",
      details: fee.toString(),
    };
  },
};

const logs: KnownJsonPart = {
  path: ["logs"],
  getOutlineItem: () => {
    return {
      title: "Logs",
      icon: "list-flat",
    };
  },
};

const logEntries: KnownJsonPart = {
  path: ["logs", "*", "message"],
  getOutlineItem: (node) => {
    const property = node.parent;
    const propertyDetails = getPropertyDetails(property);
    const details = propertyDetails?.value as string;
    if (!details) {
      return undefined;
    }

    return {
      title: details,
      open: true,
    };
  },
};

const result: KnownJsonPart = {
  path: ["result"],
  getOutlineItem: () => {
    return {
      title: "Result",
      icon: "pass",
    };
  },
};

const transactionHash: KnownJsonPart = {
  path: ["transaction_hash"],
  getOutlineItem: () => {
    return {
      title: "Transaction Hash",
      icon: "symbol-numeric",
    };
  },
};

export const TRANSACTION_EXECUTION_PARTS = [
  events,
  executionResults,
  feeReceipt,
  feeRequested,
  feePaid,
  logs,
  logEntries,
  result,
  transactionHash,
];
