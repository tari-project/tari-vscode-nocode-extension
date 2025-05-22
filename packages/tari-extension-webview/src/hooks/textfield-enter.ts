import React, { useEffect } from "react";
import * as ve from "@vscode-elements/elements";

export function useEnterKey(ref: React.RefObject<ve.VscodeTextfield | null>, onEnter: () => void) {
  useEffect(() => {
    let inputElement: HTMLInputElement | null = null;
    let observer: MutationObserver | null = null;
    let handleKeyDown: ((event: KeyboardEvent) => void) | null = null;

    const element = ref.current;
    if (!element) {
      return;
    }

    if (element.shadowRoot) {
      const shadowRoot = element.shadowRoot;
      inputElement = shadowRoot.querySelector("input");

      const attachEvents = () => {
        inputElement = shadowRoot.querySelector("input");
        if (inputElement) {
          handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Enter") {
              onEnter();
            }
          };
          inputElement.addEventListener("keydown", handleKeyDown);
          if (observer) {
            observer.disconnect();
            observer = null;
          }
        }
      };

      if (inputElement) {
        attachEvents();
      } else {
        observer = new MutationObserver(attachEvents);
        observer.observe(shadowRoot, { childList: true, subtree: true });
      }

      return () => {
        if (inputElement && handleKeyDown) {
          inputElement.removeEventListener("keydown", handleKeyDown);
        }
        if (observer) {
          observer.disconnect();
        }
      };
    }

    return () => undefined;
  }, [ref, onEnter]);
}
