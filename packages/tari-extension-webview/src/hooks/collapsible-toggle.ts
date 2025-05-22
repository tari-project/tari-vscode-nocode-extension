import { useEffect, useRef } from "react";
import * as ve from "@vscode-elements/elements";
import { VscCollapsibleToggleEvent } from "@vscode-elements/elements/dist/vscode-collapsible/vscode-collapsible";

export function useCollapsibleToggle(onToggle: (open: boolean) => void) {
  const collapsibleRef = useRef<ve.VscodeCollapsible | null>(null);

  useEffect(() => {
    if (!collapsibleRef.current) return;
    const collapsibleElement = collapsibleRef.current as HTMLElement;

    function handleToggle(event: VscCollapsibleToggleEvent) {
      onToggle(event.detail.open);
    }

    collapsibleElement.addEventListener("vsc-collapsible-toggle", handleToggle);
    return () => {
      collapsibleElement.removeEventListener("vsc-collapsible-toggle", handleToggle);
    };
  }, [onToggle]);

  return collapsibleRef;
}
