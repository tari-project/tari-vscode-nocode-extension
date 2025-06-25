import { Markdown } from "@tari-project/tari-extension-common";
import { CborValue, parseCbor } from "../../utils/cbor";
import { KnownJsonPart } from "../JsonOutline";
import { getPropertyDetails } from "../tree-node-helpers";
import { SUBSTATE_ICON } from "./substate-list";

const substateRoot: KnownJsonPart = {
  path: ["value", "*"],
  getOutlineItem: (node) => {
    const property = node.parent;
    const propertyDetails = getPropertyDetails(property);
    const title = propertyDetails?.key;
    if (!title) {
      return undefined;
    }
    const icon = SUBSTATE_ICON[title] ?? "";

    return {
      title,
      icon,
      open: true,
    };
  },
};

const vaultResourceContainer: KnownJsonPart = {
  path: ["value", "Vault", "resource_container"],
  getOutlineItem: () => {
    return {
      title: "Resource Container",
      icon: "folder",
    };
  },
};

const componentAccessRules: KnownJsonPart = {
  path: ["value", "Component", "access_rules"],
  getOutlineItem: () => {
    return {
      title: "Access Rules",
      icon: "shield",
    };
  },
};

const componentState: KnownJsonPart = {
  path: ["value", "Component", "body", "state"],
  getOutlineItem: (node, json) => {
    let hoverMessage: Markdown | undefined;

    const property = node.parent;
    if (property?.children && property.children.length === 2) {
      const { offset, length } = property.children[1];
      const stateJson = json.substring(offset, offset + length);
      const state = parseCbor(JSON.parse(stateJson) as CborValue);
      hoverMessage = {
        text: JSON.stringify(state, null, 2),
        language: "json",
      };
    }

    return {
      title: "State",
      icon: "file-binary",
      hoverMessage,
    };
  },
};

const componentEntityId: KnownJsonPart = {
  path: ["value", "Component", "entity_id"],
  getOutlineItem: () => {
    return {
      title: "Entity ID",
      icon: "tag",
    };
  },
};

const componentModuleName: KnownJsonPart = {
  path: ["value", "Component", "module_name"],
  getOutlineItem: (node) => {
    const property = node.parent;
    const propertyDetails = getPropertyDetails(property);
    const details = propertyDetails?.value as string;
    if (!details) {
      return undefined;
    }
    return {
      title: "Module Name",
      icon: "file-submodule",
      details,
    };
  },
};

const componentTemplateAddress: KnownJsonPart = {
  path: ["value", "Component", "template_address"],
  getOutlineItem: () => {
    return {
      title: "Template Address",
      icon: "location",
    };
  },
};

export const SUBSTATE_DETAILS_PARTS = [
  substateRoot,
  vaultResourceContainer,
  componentAccessRules,
  componentState,
  componentEntityId,
  componentModuleName,
  componentTemplateAddress,
];
