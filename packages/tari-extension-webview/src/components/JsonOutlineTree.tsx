import { VscodeLabel, VscodeTree } from "@vscode-elements/react-elements";
import * as ve from "@vscode-elements/elements";
import { CALL_NODE_DRAG_DROP_TYPE, JsonOutlineItem } from "@tari-project/tari-extension-common";
import { VscTreeActionEvent, VscTreeSelectEvent } from "@vscode-elements/elements/dist/vscode-tree/vscode-tree";
import { buildTree, TreeNode } from "../json-parser/tree-builder";
import { useCallback, useEffect, useRef } from "react";

interface JsonOutlineProps {
  items: JsonOutlineItem[];
  onSelect?: (item: JsonOutlineItem) => void;
  onAction?: (actionId: string, item: JsonOutlineItem) => void;
  onDrag?: (item: JsonOutlineItem) => Record<string, unknown> | null;
}

type IndexedItem<T> = T & { index: number };

function JsonOutlineTree({ items, onSelect, onAction, onDrag }: JsonOutlineProps) {
  const treeRef = useRef<HTMLDivElement | null>(null);

  const indexedItems = items.map((item, index) => ({ ...item, index }));
  const treeNodes = buildTree(indexedItems);
  const treeItems = mapTree(treeNodes, (item) => {
    const icons = item.icon ? { leaf: item.icon } : undefined;
    const description = item.details ? `(${item.details})` : undefined;
    return {
      label: item.title,
      description,
      icons,
      value: item.index.toString(),
      actions: item.actions,
      open: item.open,
    };
  });

  const findTreeNode = useCallback(
    (path: string): TreeNode<JsonOutlineItem> | null => {
      const parts = path.split("/").map((n) => parseInt(n));
      let root: typeof treeNodes | undefined = treeNodes;
      let result = null;
      for (const part of parts) {
        if (!root || root.length <= part) {
          return null;
        }
        result = root[part];
        root = result.children;
      }
      return result;
    },
    [treeNodes],
  );

  const handleDragStart = useCallback(
    (event: DragEvent, item: JsonOutlineItem) => {
      if (event.dataTransfer && onDrag) {
        const data = onDrag(item);
        event.dataTransfer.setData(CALL_NODE_DRAG_DROP_TYPE, JSON.stringify(data));
        event.dataTransfer.effectAllowed = "move";
      }
    },
    [onDrag],
  );

  useEffect(() => {
    if (!treeRef.current || !onDrag) {
      return;
    }
    const treeElement = treeRef.current;
    const tree = treeElement.querySelectorAll("vscode-tree");
    const shadowRoot = tree[0].shadowRoot;
    if (!shadowRoot) {
      return;
    }

    const attachDragEvents = () => {
      requestAnimationFrame(() => {
        if (!tree.length) {
          return;
        }
        const nodes = shadowRoot.querySelectorAll("li");
        for (const node of nodes) {
          const dataPath = node.getAttribute("data-path");
          if (dataPath) {
            const found = findTreeNode(dataPath);
            if (found?.item.draggable) {
              node.draggable = true;

              const handleItemDragStart = (event: DragEvent) => {
                handleDragStart(event, found.item);
              };

              node.removeEventListener("dragstart", handleItemDragStart);
              node.addEventListener("dragstart", handleItemDragStart);
            }
          }
        }
      });
    };

    const observer = new MutationObserver(attachDragEvents);
    observer.observe(shadowRoot, { childList: true, subtree: true });

    attachDragEvents();

    return () => {
      observer.disconnect();
    };
  }, [findTreeNode, onDrag, handleDragStart]);

  const handleSelect = (event: VscTreeSelectEvent) => {
    const index = parseInt(event.detail.value);
    if (Number.isNaN(index) || index >= items.length) {
      return;
    }
    const item = items[index];
    if (onSelect) {
      onSelect(item);
    }
  };

  const handleAction = (event: VscTreeActionEvent) => {
    const index = parseInt(event.detail.value);
    if (Number.isNaN(index) || index >= items.length) {
      return;
    }
    const item = items[index];
    if (onAction) {
      onAction(event.detail.actionId, item);
    }
  };

  const hasItems = treeItems.length > 0;
  return (
    <>
      {hasItems && (
        <div ref={treeRef}>
          <VscodeTree data={treeItems} onVscTreeSelect={handleSelect} onVscTreeAction={handleAction} />
        </div>
      )}
      {!hasItems && <VscodeLabel>No Items</VscodeLabel>}
    </>
  );
}

type TreeItem = ve.VscodeTree["data"][0];

function mapTree(
  from: TreeNode<IndexedItem<JsonOutlineItem>>[],
  f: (item: IndexedItem<JsonOutlineItem>) => TreeItem,
): TreeItem[] {
  const mappedTreeNodes: TreeItem[] = [];
  for (const node of from) {
    const mappedNode: TreeItem = f(node.item);
    if (node.children) {
      mappedNode.subItems = mapTree(node.children, f);
    }
    mappedTreeNodes.push(mappedNode);
  }
  return mappedTreeNodes;
}

export default JsonOutlineTree;
