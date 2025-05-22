import { KnownJsonPart } from "../JsonOutline";
import { getPropertyDetails, getSiblingProperties } from "../tree-node-helpers";

export const SUBSTATE_ICON: Record<string, string> = {
  Vault: "database",
  Component: "package",
  Resource: "file",
  Template: "layout",
};

const substateOverview: KnownJsonPart = {
  path: ["substates", "*", "substate_id"],
  getOutlineItem: (node) => {
    const property = node.parent;
    const propertyDetails = getPropertyDetails(property);
    const substateId = propertyDetails?.value;
    if (!substateId) {
      return undefined;
    }
    const title = getSubstateTyoe(substateId as string);

    const moduleName = getSiblingProperties(property).find(({ key }) => key === "module_name");
    const details = moduleName?.value ? moduleName.value.toString() : undefined;
    const icon = SUBSTATE_ICON[title] ?? "";
    const actions = [
      {
        actionId: "details",
        icon: "open-preview",
        tooltip: "Open Substate Details",
      },
    ];

    return {
      title,
      icon,
      details,
      value: substateId,
      actions,
    };
  },
};

function getSubstateTyoe(id: string): string {
  const parts = id.split("_");
  if (parts.length < 2) {
    return "Unknown";
  }
  const type = parts[0];
  return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

export const SUBSTATE_LIST_PARTS = [substateOverview];
