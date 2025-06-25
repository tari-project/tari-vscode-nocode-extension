import { findNodeAtOffset, JSONPath, parseTree, visit, Node } from "jsonc-parser";
import { JsonDocument } from "./JsonDocument";
import { pathMatches } from "./path-matches";
import { JsonOutlineItem, JsonOutlineItemBase } from "@tari-project/tari-extension-common";

export interface KnownJsonPart {
  path: JSONPath;
  getOutlineItem: (node: Node, json: string) => JsonOutlineItemBase | undefined;
}

export class JsonOutline {
  public items: JsonOutlineItem[] = [];

  constructor(
    public document: JsonDocument,
    private knownParts: KnownJsonPart[],
  ) {
    this.parse();
  }

  private parse() {
    const tree = parseTree(this.document.jsonString);
    if (!tree) {
      return;
    }

    visit(this.document.jsonString, {
      onObjectProperty: (property, offset, length, _startLine, _startCharacter, pathSupplier) => {
        const currentPath = pathSupplier();
        currentPath.push(property);
        for (const part of this.knownParts) {
          if (pathMatches(part.path, currentPath)) {
            const node = findNodeAtOffset(tree, offset);
            if (node) {
              const outlineItem = part.getOutlineItem(node, this.document.jsonString);
              if (outlineItem) {
                this.items.push({
                  title: outlineItem.title,
                  details: outlineItem.details,
                  icon: outlineItem.icon,
                  open: outlineItem.open,
                  draggable: outlineItem.draggable,
                  actions: outlineItem.actions,
                  value: outlineItem.value,
                  hoverMessage: outlineItem.hoverMessage,
                  path: currentPath,
                  offset,
                  length,
                });
              }
            }
          }
        }
      },
    });
  }
}
