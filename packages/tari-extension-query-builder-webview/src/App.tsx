import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { QueryBuilder, TemplateReader, useStore } from "tari-extension-query-builder";
import { GeneratedCodeType, Messenger, TariFlowMessages, TariFlowNodeDetails, Theme } from "tari-extension-common";

import "tari-extension-query-builder/dist/tari-extension-query-builder.css";
import "./root.css";
import { TemplateDef } from "@tari-project/typescript-bindings";
import { Transaction } from "@tari-project/tarijs-all";

interface AppProps {
  messenger: Messenger<TariFlowMessages> | undefined;
}

function App({ messenger }: AppProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [editable, setEditable] = useState(true);
  const [readySent, setReadySent] = useState(false);

  const changeCounter = useStore((store) => store.changeCounter);
  const saveStateToString = useStore((store) => store.saveStateToString);
  const loadStateFromString = useStore((store) => store.loadStateFromString);
  const addNodeAt = useStore((store) => store.addNodeAt);

  const addNodesToCenter = useCallback(
    (details: TariFlowNodeDetails) => {
      const reader = new TemplateReader(details.template as TemplateDef, details.templateAddress);
      const nodeData = reader.getGenericNode(details.functionName);
      if (nodeData) {
        addNodeAt(nodeData);
      }
    },
    [addNodeAt],
  );

  const [changeCounterDebounced] = useDebounce(changeCounter, 100);

  useEffect(() => {
    if (!messenger) {
      return;
    }
    messenger.registerHandler("init", (params) => {
      try {
        const { theme, editable, data } = params;
        setTheme(theme);
        setEditable(editable);
        loadStateFromString(data);
        return Promise.resolve(undefined);
      } catch (e: unknown) {
        return Promise.reject(Error(String(e)));
      }
    });
    messenger.registerHandler("setTheme", (newTheme) => {
      setTheme(newTheme);
      return Promise.resolve(undefined);
    });
    messenger.registerHandler("getData", () => {
      return Promise.resolve(saveStateToString());
    });
    messenger.registerHandler("addNode", (details) => {
      addNodesToCenter(details);
      return Promise.resolve(undefined);
    });

    if (!readySent) {
      messenger.send("ready", undefined).catch(console.log);
      setReadySent(true);
    }
  }, [messenger, saveStateToString, loadStateFromString, addNodesToCenter, readySent, setReadySent]);

  useEffect(() => {
    if (!messenger || !changeCounterDebounced) {
      return;
    }
    messenger.send("documentChanged", undefined).catch(console.log);
  }, [messenger, changeCounterDebounced]);

  const getTransactionProps = useCallback(async () => {
    if (!messenger) {
      throw new Error("Messenger is not ready.");
    }
    const result = await messenger.send("getTransactionProps", undefined);
    return result;
  }, [messenger]);

  const executeTransaction = useCallback(
    async (transaction: Transaction, dryRun: boolean) => {
      if (!messenger) {
        throw new Error("Messenger is not ready.");
      }
      const timeout = 30_000; // 30 seconds
      const request = {
        transaction: transaction as unknown as Record<string, unknown>,
        dryRun,
      };
      await messenger.send("executeTransaction", request, timeout);
      return undefined;
    },
    [messenger],
  );

  const showGeneratedCode = useCallback(
    async (code: string, type: GeneratedCodeType) => {
      if (!messenger) {
        throw new Error("Messenger is not ready.");
      }
      const timeout = 2_000; // 2 seconds
      await messenger.send(
        "showGeneratedCode",
        {
          code,
          type,
        },
        timeout,
      );
      return undefined;
    },
    [messenger],
  );

  return (
    <>
      <QueryBuilder
        theme={theme}
        readOnly={!editable}
        getTransactionProps={getTransactionProps}
        executeTransaction={executeTransaction}
        showGeneratedCode={showGeneratedCode}
      />
    </>
  );
}

export default App;
