import { KnownJsonPart } from "../JsonOutline";

const accountIdKnownPart: KnownJsonPart = {
  path: ["account", "name"],
  getOutlineItem: () => {
    return {
      title: "Account Name",
      icon: "account",
    };
  },
};

const accountAddressKnownPart: KnownJsonPart = {
  path: ["account", "address"],
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

export const ACCOUNT_KNOWN_PARTS = [accountIdKnownPart, accountAddressKnownPart, accountPublicKeyKnownPart];
