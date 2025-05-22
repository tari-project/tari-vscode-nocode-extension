import { KnownJsonPart } from "../JsonOutline";
import { getPropertyDetails, getSiblingProperties } from "../tree-node-helpers";

const templateName: KnownJsonPart = {
  path: ["V1", "template_name"],
  getOutlineItem: (node) => {
    const property = node.parent;
    const propertyDetails = getPropertyDetails(property);
    const details = propertyDetails?.value as string;
    if (!details) {
      return undefined;
    }
    const icon = "symbol-namespace";

    return {
      title: "Template",
      details,
      icon,
    };
  },
};

const functionsContainer: KnownJsonPart = {
  path: ["V1", "functions"],
  getOutlineItem: () => {
    return {
      title: "Functions",
      icon: "folder",
      open: true,
    };
  },
};

const argumentsContainer: KnownJsonPart = {
  path: ["V1", "functions", "*", "arguments"],
  getOutlineItem: (node) => {
    const functionName = getSiblingProperties(node.parent).find(({ key }) => key === "name");
    if (!functionName) {
      return undefined;
    }
    const actions = [
      {
        actionId: "add-node",
        icon: "add",
        tooltip: "Add to query builder",
      },
    ];
    return {
      title: functionName.value as string,
      icon: "symbol-parameter",
      actions,
      draggable: true,
    };
  },
};

const argumentName: KnownJsonPart = {
  path: ["V1", "functions", "*", "arguments", "*", "name"],
  getOutlineItem: (node) => {
    const property = node.parent;
    const propertyDetails = getPropertyDetails(property);
    const title = propertyDetails?.value as string;
    if (!title) {
      return undefined;
    }

    return {
      title,
    };
  },
};

export const TEMPLATE_DETAILS_PARTS = [templateName, functionsContainer, argumentsContainer, argumentName];
