import { Node } from "jsonc-parser";

type RawNodeValue = string | number | boolean | null;

interface PropertyDetails {
  key: string;
  value: RawNodeValue;
}

export function getPropertyDetails(node?: Node): PropertyDetails | null {
  if (!node || node.type !== "property") {
    return null;
  }
  const values = node.children?.map(getNodeRawValue) ?? [];
  return values.length === 2 ? { key: values[0] as string, value: values[1] } : null;
}

export function getNodeRawValue(node: Node): RawNodeValue {
  switch (node.type) {
    case "string":
      return node.value as string;
    case "number":
      return node.value as number;
    case "boolean":
      return node.value as boolean;
  }
  return null;
}

export function getSiblingProperties(node?: Node): PropertyDetails[] {
  const obj = node?.parent;
  if (!obj?.children) {
    return [];
  }
  return obj.children.map(getPropertyDetails).filter((d) => d != null);
}
