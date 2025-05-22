export interface TreeItemAction {
  actionId: string;
  icon: string;
  tooltip?: string;
}

export interface Markdown {
  text: string;
  language?: string;
}

export interface JsonOutlineItemBase {
  title: string;
  details?: string;
  icon?: string;
  value?: unknown;
  hoverMessage?: Markdown;
  actions?: TreeItemAction[];
  open?: boolean;
  draggable?: boolean;
}

export type Segment = string | number;
export type JSONPath = Segment[];

export interface JsonOutlineItem extends JsonOutlineItemBase {
  path: JSONPath;
  offset: number;
  length: number;
}
