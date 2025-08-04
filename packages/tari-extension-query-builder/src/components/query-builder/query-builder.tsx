import {
  ReactFlow,
  Background,
  Controls,
  useViewport,
  ReactFlowProvider,
  Viewport,
  Panel,
  MiniMap,
  OnEdgesChange,
  OnNodesChange,
  OnConnect,
} from "@xyflow/react";
import {
  CALL_NODE_DRAG_DROP_TYPE,
  GeneratedCodeType,
  TariNetwork,
  TransactionProps,
} from "@tari-project/tari-extension-common";
import useStore from "../../store/store";
import { useShallow } from "zustand/shallow";
import { InputConnectionType, GenericNodeType, NodeType, QueryBuilderState } from "@/store/types";
import { useTranslation } from "react-i18next";
import i18n, { resolveI18nLanguage } from "./i18n";
import { useCallback, useEffect, useRef, useState } from "react";
import ButtonEdge from "./edges/button-edge";
import { TariFlowNodeDetails } from "@/types";
import { TemplateReader } from "@/query-builder/template-reader";
import { Toaster } from "@/components/ui/sonner";

import "../../index.css";
import "@xyflow/react/dist/style.css";
import "@/xy-theme.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import {
  ArchiveIcon,
  CheckCircledIcon,
  Component1Icon,
  EnterIcon,
  FileTextIcon,
  InputIcon,
  LayersIcon,
  PlayIcon,
  RocketIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import GenericNode from "./nodes/generic/generic-node";
import InputParamsNode from "./nodes/input/input-params-node";
import { ExecutionPlanner } from "@/execute/ExecutionPlanner";
import { AmbiguousOrderError } from "@/execute/AmbiguousOrderError";
import { CycleDetectedError } from "@/execute/CycleDetectedError";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Amount, Network } from "@tari-project/tarijs-all";
import { MissingDataError } from "@/execute/MissingDataError";
import { toast } from "sonner";
import { LoadingSpinner } from "../ui/loading-spinner";
import { BuilderCodegen } from "@/codegen/BuilderCodegen";
import { getNextAvailable } from "@/lib/get-next-available";
import { ALLOCATE_COMPONENT_ADDRESS_RESULT, ALLOCATE_RESOURCE_ADDRESS_RESULT } from "./nodes/generic-node.types";
import { UnsignedTransactionV1 } from "@tari-project/typescript-bindings";

export type Theme = "dark" | "light";

const selector = (state: QueryBuilderState) => ({
  nodes: state.nodes,
  edges: state.edges,
  setLanguage: state.setLanguage,
  setReadOnly: state.setReadOnly,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  addNode: state.addNode,
  isValidConnection: state.isValidConnection,
  updateCenter: state.updateCenter,
  addNodeAt: state.addNodeAt,
  getNodeById: state.getNodeById,
  isValidInputParamsTitle: state.isValidInputParamsTitle,
  loadStateFromString: state.loadStateFromString,
  saveStateToString: state.saveStateToString,
});

export interface QueryBuilderProps {
  language?: string;
  theme: Theme;
  readOnly?: boolean;
  allowLoadAndExportFlow?: boolean;
  getTransactionProps?: () => Promise<TransactionProps>;
  executeTransaction?: (transaction: UnsignedTransactionV1) => Promise<void>;
  showGeneratedCode?: (code: string, type: GeneratedCodeType) => Promise<void>;
  onEdgesChange?: OnEdgesChange;
  onNodesChange?: OnNodesChange;
  onConnect?: OnConnect;
}

const nodeTypes = {
  [NodeType.GenericNode]: GenericNode,
  [NodeType.InputParamsNode]: InputParamsNode,
};

const edgeTypes = {
  buttonEdge: ButtonEdge,
};

function Flow({
  language,
  theme,
  readOnly = false,
  allowLoadAndExportFlow = false,
  getTransactionProps,
  executeTransaction,
  showGeneratedCode,
  onEdgesChange: onEdgesChangeCallback,
  onNodesChange: onNodesChangeCallback,
  onConnect: onConnectCallback,
}: QueryBuilderProps) {
  const {
    nodes,
    edges,
    setLanguage,
    setReadOnly,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isValidConnection,
    updateCenter,
    addNodeAt,
    getNodeById,
    isValidInputParamsTitle,
    loadStateFromString,
    saveStateToString,
  } = useStore(useShallow(selector));
  const { t } = useTranslation();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState(useViewport());
  const [loading, setLoading] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const reactflowRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFlow = useCallback(
    (readDataString: string) => {
      try {
        loadStateFromString(readDataString);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
          setIsErrorDialogOpen(true);
        } else {
          setErrorMessage("An unknown error occurred while loading the flow.");
          setIsErrorDialogOpen(true);
        }
      }
    },
    [setErrorMessage, setIsErrorDialogOpen, loadStateFromString],
  );

  const readFileAndLoadFlow = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const readDataString = e.target?.result as string;
        loadFlow(readDataString);
      };
      reader.onerror = () => {
        setErrorMessage("Failed to read the selected file.");
        setIsErrorDialogOpen(true);
      };
      reader.readAsText(file);
    },
    [loadFlow, setErrorMessage, setIsErrorDialogOpen],
  );

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        readFileAndLoadFlow(file);
      }
    },
    [readFileAndLoadFlow],
  );

  const executeEnabled = !!getTransactionProps && !!executeTransaction;
  const generateCodeEnabled = !!getTransactionProps && !!showGeneratedCode;

  const onMove = useCallback(
    (_event: unknown, viewport: Viewport) => {
      setViewport(viewport);
    },
    [setViewport],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();

      if (allowLoadAndExportFlow && event.dataTransfer.files.length > 0) {
        const files = Array.from(event.dataTransfer.files);
        const tariFiles = files.filter((file) => file.name.endsWith(".tari"));

        if (tariFiles.length > 0) {
          readFileAndLoadFlow(tariFiles[0]);
          return;
        }
      }

      const data = event.dataTransfer.getData(CALL_NODE_DRAG_DROP_TYPE);
      if (data) {
        const json = JSON.parse(data) as TariFlowNodeDetails;
        const reader = new TemplateReader(json.template, json.templateAddress);

        const reactflowBounds = reactflowRef.current?.getBoundingClientRect();
        const flowX = (event.clientX - (reactflowBounds?.left ?? 0) - viewport.x) / viewport.zoom;
        const flowY = (event.clientY - (reactflowBounds?.top ?? 0) - viewport.y) / viewport.zoom;

        const nodeData = reader.getGenericNode(json.functionName);
        if (nodeData) {
          addNodeAt(nodeData, { x: flowX, y: flowY });
        }
      }
    },
    [addNodeAt, viewport, allowLoadAndExportFlow, readFileAndLoadFlow],
  );

  const buildTransactionDescriptions = useCallback(
    async (getTransactionProps: () => Promise<TransactionProps>) => {
      const planner = new ExecutionPlanner(nodes, edges);
      try {
        const executionOrder = planner.getExecutionOrder();
        const { network, accountAddress, fee } = await getTransactionProps();
        const details = planner.buildTransactionDescription(executionOrder, accountAddress, Amount.of(fee));
        return { network, planner, details };
      } catch (e) {
        let errorMessage = "Failed to determine execution order";
        if (e instanceof AmbiguousOrderError) {
          const getNodeName = (id: string) => {
            const node = getNodeById(id);
            if (!node || node.type !== NodeType.GenericNode) {
              return id;
            }
            if (node.data.type === GenericNodeType.StartNode) {
              return "Start node";
            }
            return node.data.title ?? id;
          };
          const nodeA = getNodeName(e.nodeA);
          const nodeB = getNodeName(e.nodeB);
          if (nodeA && nodeB) {
            errorMessage = `Ambiguous order between "${nodeA}" and "${nodeB}" operations. Please, add explicit connections.`;
          }
        } else if (e instanceof CycleDetectedError) {
          errorMessage = "Cycle detected! Make sure to eliminate it.";
        } else if (e instanceof MissingDataError) {
          const node = e.nodes[0];
          errorMessage =
            e.nodes.length > 1 ? `Missing data in node "${node}" and other nodes."` : `Missing data in node "${node}"`;
        } else if (e instanceof Error) {
          errorMessage = e.message;
        } else {
          console.log(e);
        }
        throw new Error(errorMessage);
      }
    },
    [nodes, edges, getNodeById],
  );

  const getNetwork = (network: TariNetwork) => {
    switch (network) {
      case TariNetwork.MainNet:
        return Network.MainNet;
      case TariNetwork.StageNet:
        return Network.StageNet;
      case TariNetwork.NextNet:
        return Network.NextNet;
      case TariNetwork.LocalNet:
        return Network.LocalNet;
      case TariNetwork.Igor:
        return Network.Igor;
      case TariNetwork.Esmeralda:
        return Network.Esmeralda;
    }
  };

  const handleExecute = useCallback(
    async (dryRun: boolean) => {
      if (!getTransactionProps || !executeTransaction) {
        return;
      }

      setLoading(true);
      try {
        const { network, planner, details } = await buildTransactionDescriptions(getTransactionProps);
        const transaction = planner.buildTransaction(getNetwork(network), details, dryRun);
        await executeTransaction(transaction);
        toast.success("Transaction executed");
      } catch (e) {
        if (e instanceof Error) {
          setErrorMessage(e.message);
          setIsErrorDialogOpen(true);
        }
      }
      setLoading(false);
    },
    [getTransactionProps, executeTransaction, buildTransactionDescriptions],
  );

  const handleLoadFlow = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleExportFlow = () => {
    const flowData = saveStateToString();
    const blob = new Blob([flowData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flow.tari";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateCode = useCallback(
    async (typescript: boolean) => {
      if (!getTransactionProps || !showGeneratedCode) {
        return;
      }

      setLoading(true);
      try {
        const { details } = await buildTransactionDescriptions(getTransactionProps);
        const codegen = new BuilderCodegen(details);
        const code = typescript ? codegen.generateTypescriptCode() : codegen.generateJavascriptCode();
        await showGeneratedCode(code, typescript ? GeneratedCodeType.Typescript : GeneratedCodeType.Javascript);
      } catch (e) {
        if (e instanceof Error) {
          setErrorMessage(e.message);
          setIsErrorDialogOpen(true);
        }
      }
      setLoading(false);
    },
    [getTransactionProps, showGeneratedCode, buildTransactionDescriptions],
  );

  const handleAddStartNode = useCallback(() => {
    addNodeAt({
      type: NodeType.GenericNode,
      data: {
        type: GenericNodeType.StartNode,
        hasExitConnection: true,
        icon: "enter",
        largeCaption: "START",
      },
    });
  }, [addNodeAt]);

  const handleAddInputParamsNode = useCallback(() => {
    const title = getNextAvailable("input", (title) => isValidInputParamsTitle("", title));
    addNodeAt({
      type: NodeType.InputParamsNode,
      data: {
        title,
        values: {},
        inputs: [],
      },
    });
  }, [addNodeAt, isValidInputParamsTitle]);

  const handleAddEmitLogNode = useCallback(() => {
    addNodeAt({
      type: NodeType.GenericNode,
      data: {
        type: GenericNodeType.EmitLogNode,
        hasEnterConnection: true,
        hasExitConnection: true,
        icon: "rocket",
        title: "Emit Log",
        inputs: [
          {
            inputConnectionType: InputConnectionType.None,
            name: "log_level",
            label: "Log Level",
            type: "String",
            validValues: ["Error", "Warn", "Info", "Debug"],
          },
          {
            inputConnectionType: InputConnectionType.None,
            name: "message",
            label: "Message",
            type: "String",
          },
        ],
      },
    });
  }, [addNodeAt]);

  const handleAddAssertBucketContainsNode = useCallback(() => {
    addNodeAt({
      type: NodeType.GenericNode,
      data: {
        type: GenericNodeType.AssertBucketContains,
        hasEnterConnection: true,
        hasExitConnection: true,
        icon: "check-circled",
        title: "Assert Bucket Contains",
        inputs: [
          {
            inputConnectionType: InputConnectionType.None,
            name: "key",
            label: "Key",
            type: { Vec: "U8" },
          },
          {
            inputConnectionType: InputConnectionType.None,
            name: "resource_address",
            label: "Resource Address",
            type: { Other: { name: "ResourceAddress" } },
          },
          {
            inputConnectionType: InputConnectionType.None,
            name: "min_amount",
            label: "Minimum Amount",
            type: { Other: { name: "Amount" } },
          },
        ],
      },
    });
  }, [addNodeAt]);

  const handleAddAllocateComponentAddressNode = useCallback(() => {
    addNodeAt({
      type: NodeType.GenericNode,
      data: {
        type: GenericNodeType.AllocateComponentAddress,
        hasEnterConnection: true,
        hasExitConnection: true,
        icon: "component",
        title: "Allocate Component Address",
        inputs: [
          {
            inputConnectionType: InputConnectionType.None,
            name: "component_name",
            label: "Component Name",
            type: "String",
          },
        ],
        output: {
          type: { Other: { name: "ComponentAddressAllocation" } },
          name: ALLOCATE_COMPONENT_ADDRESS_RESULT,
          label: "ComponentAddressAllocation",
        },
      },
    });
  }, [addNodeAt]);

  const handleAddAllocateResourceAddressNode = useCallback(() => {
    addNodeAt({
      type: NodeType.GenericNode,
      data: {
        type: GenericNodeType.AllocateResourceAddress,
        hasEnterConnection: true,
        hasExitConnection: true,
        icon: "archive",
        title: "Allocate Resource Address",
        inputs: [
          {
            inputConnectionType: InputConnectionType.None,
            name: "resource_name",
            label: "Resource Name",
            type: "String",
          },
        ],
        output: {
          type: { Other: { name: "ResourceAddressAllocation" } },
          name: ALLOCATE_RESOURCE_ADDRESS_RESULT,
          label: "ResourceAddressAllocation",
        },
      },
    });
  }, [addNodeAt]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    setReadOnly(readOnly);
  }, [setReadOnly, readOnly]);

  useEffect(() => {
    if (language) {
      setLanguage(resolveI18nLanguage(language));
      i18n.changeLanguage(language).catch(console.log);
    }
  }, [setLanguage, language]);

  useEffect(() => {
    const updateDimensions = () => {
      if (reactflowRef.current) {
        setDimensions({
          width: reactflowRef.current.clientWidth,
          height: reactflowRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  useEffect(() => {
    if (!reactflowRef.current) return;

    const { width, height } = dimensions;

    const centerX = (width / 2 - viewport.x) / viewport.zoom;
    const centerY = (height / 2 - viewport.y) / viewport.zoom;

    updateCenter(centerX, centerY);
  }, [dimensions, viewport, updateCenter]);

  return (
    <>
      <input type="file" accept=".tari" ref={fileInputRef} style={{ display: "none" }} onChange={onFileChange} />
      <ReactFlowProvider>
        <ReactFlow
          ref={reactflowRef}
          nodesConnectable={!readOnly}
          nodesDraggable={!readOnly}
          nodesFocusable={!readOnly}
          edgesFocusable={!readOnly}
          edgesReconnectable={!readOnly}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={(change) => {
            onNodesChange(change);
            onNodesChangeCallback?.(change);
          }}
          onEdgesChange={(change) => {
            onEdgesChange(change);
            onEdgesChangeCallback?.(change);
          }}
          onConnect={(connection) => {
            onConnect(connection);
            onConnectCallback?.(connection);
          }}
          onMove={onMove}
          onDragOver={onDragOver}
          onDrop={onDrop}
          colorMode={theme}
          fitView
          minZoom={0.05}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "buttonEdge",
          }}
          isValidConnection={isValidConnection}
        >
          <Panel position="top-right" style={{ right: "15px" }}>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {loading ? <LoadingSpinner type="short" className="h-4 w-4 animate-spin" /> : "..."}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem
                  onSelect={() => {
                    handleExecute(false).catch(console.log);
                  }}
                  disabled={!executeEnabled}
                >
                  <PlayIcon /> {t("execute")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    handleExecute(true).catch(console.log);
                  }}
                  disabled={!executeEnabled}
                >
                  <LayersIcon /> {t("executeDryRun")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger hidden={!generateCodeEnabled}>{t("generateCode")}</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onSelect={() => {
                          handleGenerateCode(true).catch(console.log);
                        }}
                      >
                        {t("typescript")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          handleGenerateCode(false).catch(console.log);
                        }}
                      >
                        {t("javascript")}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>{t("addInstruction")}</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onSelect={handleAddInputParamsNode}>
                        <InputIcon /> {t("inputParametersNode")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleAddStartNode}>
                        <EnterIcon /> {t("startNode")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleAddEmitLogNode}>
                        <RocketIcon /> {t("emitLog")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleAddAssertBucketContainsNode}>
                        <CheckCircledIcon />
                        {t("assertBucketContains")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleAddAllocateComponentAddressNode}>
                        <Component1Icon />
                        {t("allocateComponentAddress")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleAddAllocateResourceAddressNode}>
                        <ArchiveIcon />
                        {t("allocateResourceAddress")}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                {allowLoadAndExportFlow && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => {
                        handleLoadFlow();
                      }}
                    >
                      <FileTextIcon /> {t("loadFlowFromFile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        handleExportFlow();
                      }}
                    >
                      <UploadIcon /> {t("exportFlow")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </Panel>
          <Background />
          <Controls />
          <MiniMap nodeStrokeWidth={3} />
        </ReactFlow>
      </ReactFlowProvider>
      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="border-[var(--foreground)]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("executionFailed")}</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dismiss")}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function QueryBuilder({
  language,
  theme,
  readOnly = false,
  allowLoadAndExportFlow = false,
  getTransactionProps,
  executeTransaction,
  showGeneratedCode,
}: QueryBuilderProps) {
  return (
    <ReactFlowProvider>
      <Flow
        language={language}
        theme={theme}
        readOnly={readOnly}
        allowLoadAndExportFlow={allowLoadAndExportFlow}
        getTransactionProps={getTransactionProps}
        executeTransaction={executeTransaction}
        showGeneratedCode={showGeneratedCode}
      />
      <Toaster />
    </ReactFlowProvider>
  );
}

export default QueryBuilder;
