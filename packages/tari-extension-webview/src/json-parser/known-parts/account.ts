import { KnownJsonPart } from "../JsonOutline";
import { getPropertyDetails, getSiblingProperties } from "../tree-node-helpers";

const accountIdKnownPart: KnownJsonPart = {
  path: ["account_id"],
  getOutlineItem: () => {
    return {
      title: "Account ID",
      icon: "account",
    };
  },
};

const accountAddressKnownPart: KnownJsonPart = {
  path: ["address"],
  getOutlineItem: () => {
    return {
      title: "Address",
      icon: "briefcase",
    };
  },
};

const accountPublicKeyKnownPart: KnownJsonPart = {
  path: ["public_key"],
  getOutlineItem: () => {
    return {
      title: "Public Key",
      icon: "key",
    };
  },
};

const resourcesKnownPart: KnownJsonPart = {
  path: ["resources"],
  getOutlineItem: () => {
    return {
      title: "Resources",
      icon: "book",
      open: true,
    };
  },
};

const accountResourceKnownPart: KnownJsonPart = {
  path: ["resources", "*", "type"],
  getOutlineItem: (node) => {
    const property = node.parent;
    const propertyDetails = getPropertyDetails(property);
    const value = propertyDetails?.value ? ` "${propertyDetails.value.toString()}"` : "";
    const tokenSymbol = getSiblingProperties(property).find(({ key }) => key === "token_symbol");
    const details = tokenSymbol?.value ? tokenSymbol.value.toString() : undefined;
    return {
      title: `Resource${value}`,
      details,
      icon: "book",
    };
  },
};

export const ACCOUNT_KNOWN_PARTS = [
  accountIdKnownPart,
  accountAddressKnownPart,
  accountPublicKeyKnownPart,
  resourcesKnownPart,
  accountResourceKnownPart,
];
