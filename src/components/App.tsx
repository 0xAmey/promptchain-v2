import { MIXPANEL_TOKEN } from "../main";
import { isValidHuggingFaceAPIKey, isValidOpenAiAPIKey } from "../utils/apikey";
import { Column, Row } from "../utils/chakra";
import { copySnippetToClipboard } from "../utils/clipboard";
import { getFluxNodeTypeColor, getFluxNodeTypeDarkColor } from "../utils/color";
import { getPlatformModifierKey, getPlatformModifierKeyText } from "../utils/platform";
import {
  DEFAULT_SETTINGS,
  FIT_VIEW_SETTINGS,
  HOTKEY_CONFIG,
  MAX_HISTORY_SIZE,
  MODEL_SETTINGS_LOCAL_STORAGE_KEY,
  NEW_TREE_CONTENT_QUERY_PARAM,
  OVERLAP_RANDOMNESS_MAX,
  REACT_FLOW_NODE_TYPES,
  REACT_FLOW_LOCAL_STORAGE_KEY,
  TOAST_CONFIG,
  UNDEFINED_RESPONSE_STRING,
  STREAM_CANCELED_ERROR_MESSAGE,
  SAVED_CHAT_SIZE_LOCAL_STORAGE_KEY,
  OPENAI_API_KEY_LOCAL_STORAGE_KEY,
  HUGGINGFACE_API_KEY_LOCAL_STORAGE_KEY,
} from "../utils/constants";
import { useDebouncedEffect } from "../utils/debounce";
import { newFluxEdge, modifyFluxEdge, addFluxEdge } from "../utils/fluxEdge";
import {
  getFluxNode,
  getFluxNodeGPTChildren,
  displayNameFromFluxNodeType,
  newFluxNode,
  appendTextToFluxNodeAsGPT,
  getFluxNodeLineage,
  addFluxNode,
  modifyFluxNodeText,
  modifyReactFlowNodeProperties,
  getFluxNodeChildren,
  getFluxNodeParent,
  getFluxNodeSiblings,
  markOnlyNodeAsSelected,
  deleteFluxNode,
  deleteSelectedFluxNodes,
  addUserNodeLinkedToASystemNode,
  getConnectionAllowed,
  setFluxNodeStreamId,
} from "../utils/fluxNode";
import { useLocalStorage } from "../utils/lstore";
import { mod } from "../utils/mod";
import { getAvailableOpenAiChatModels } from "../utils/models";
import { generateNodeId, generateStreamId } from "../utils/nodeId";
import {
  messagesFromLineage,
  messagesFromLineageForHuggingFaceConversational,
  messagesFromLineageForHuggingFaceTextGeneration,
  promptFromLineage,
} from "../utils/prompt";
import { getQueryParam, resetURL } from "../utils/qparams";
import { useDebouncedWindowResize } from "../utils/resize";
import {
  FluxNodeData,
  FluxNodeType,
  HistoryItem,
  Settings,
  CreateChatCompletionStreamResponseChoicesInner,
  ReactFlowNodeTypes,
} from "../utils/types";
import { Prompt } from "./Prompt";
import { APIKeyModal } from "./modals/APIKeyModal";
import { SettingsModal } from "./modals/SettingsModal";
import { BigButton } from "./utils/BigButton";
import { NavigationBar } from "./utils/NavigationBar";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { Box, useDisclosure, Spinner, useToast, Button, HStack } from "@chakra-ui/react";
import mixpanel from "mixpanel-browser";
import { Resizable } from "re-resizable";
import { useEffect, useState, useCallback, useRef } from "react";
import { useBeforeunload } from "react-beforeunload";
import { useHotkeys } from "react-hotkeys-hook";
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Node,
  Edge,
  useEdgesState,
  useNodesState,
  SelectionMode,
  ReactFlowInstance,
  ReactFlowJsonObject,
  useReactFlow,
  updateEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import { OpenAI as OpenAIStreams } from "openai-streams";
import OpenAI from "openai";
import { yieldStream } from "yield-stream";

function App() {
  const toast = useToast();

  /*//////////////////////////////////////////////////////////////
                 ALLOW DRAG ON SPACEBAR HOLD LOGIC
  //////////////////////////////////////////////////////////////*/

  const [allowPanOnDrag, setAllowPanOnDrag] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setAllowPanOnDrag(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setAllowPanOnDrag(false);
      }
    };

    // Attach event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  /*//////////////////////////////////////////////////////////////
                          UNDO REDO LOGIC
  //////////////////////////////////////////////////////////////*/

  const [past, setPast] = useState<HistoryItem[]>([]);
  const [future, setFuture] = useState<HistoryItem[]>([]);

  const takeSnapshot = () => {
    // Push the current graph to the past state.
    setPast((past) => [
      ...past.slice(past.length - MAX_HISTORY_SIZE + 1, past.length),
      { nodes, edges, selectedNodeId, lastSelectedNodeId },
    ]);

    // Whenever we take a new snapshot, the redo operations
    // need to be cleared to avoid state mismatches.
    setFuture([]);
  };

  const undo = () => {
    // get the last state that we want to go back to
    const pastState = past[past.length - 1];

    if (pastState) {
      // First we remove the state from the history.
      setPast((past) => past.slice(0, past.length - 1));
      // We store the current graph for the redo operation.
      setFuture((future) => [
        ...future,
        { nodes, edges, selectedNodeId, lastSelectedNodeId },
      ]);

      // Now we can set the graph to the past state.
      setNodes(pastState.nodes);
      setEdges(pastState.edges);
      setLastSelectedNodeId(pastState.lastSelectedNodeId);
      setSelectedNodeId(pastState.selectedNodeId);

      autoZoomIfNecessary();
    }

    if (MIXPANEL_TOKEN) mixpanel.track("Performed undo");
  };

  const redo = () => {
    const futureState = future[future.length - 1];

    if (futureState) {
      setFuture((future) => future.slice(0, future.length - 1));
      setPast((past) => [...past, { nodes, edges, selectedNodeId, lastSelectedNodeId }]);
      setNodes(futureState.nodes);
      setEdges(futureState.edges);
      setLastSelectedNodeId(futureState.lastSelectedNodeId);
      setSelectedNodeId(futureState.selectedNodeId);

      autoZoomIfNecessary();
    }

    if (MIXPANEL_TOKEN) mixpanel.track("Performed redo");
  };

  /*//////////////////////////////////////////////////////////////
                        CORE REACT FLOW LOGIC
  //////////////////////////////////////////////////////////////*/

  const { setViewport, fitView } = useReactFlow();

  const [reactFlow, setReactFlow] = useState<ReactFlowInstance | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const edgeUpdateSuccessful = useRef(true);

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = (oldEdge: Edge<any>, newConnection: Connection) => {
    if (
      !getConnectionAllowed(nodes, edges, {
        source: newConnection.source!,
        target: newConnection.target!,
      })
    )
      return;

    takeSnapshot();

    edgeUpdateSuccessful.current = true;

    setEdges((edges) => updateEdge(oldEdge, newConnection, edges));
  };

  const onEdgeUpdateEnd = (_: unknown, edge: Edge<any>) => {
    if (!edgeUpdateSuccessful.current) {
      takeSnapshot();

      setEdges((edges) => edges.filter((e) => e.id !== edge.id));
    }

    edgeUpdateSuccessful.current = true;
  };

  const onConnect = (connection: Edge<any> | Connection) => {
    if (
      !getConnectionAllowed(nodes, edges, {
        source: connection.source!,
        target: connection.target!,
      })
    )
      return;

    takeSnapshot();
    setEdges((eds) => addEdge({ ...connection }, eds));
  };

  const autoZoom = () => setTimeout(() => fitView(FIT_VIEW_SETTINGS), 50);

  const autoZoomIfNecessary = () => {
    if (settings.autoZoom) autoZoom();
  };

  const trackedAutoZoom = () => {
    // autoZoom();

    if (MIXPANEL_TOKEN) mixpanel.track("Zoomed out and centered");
  };

  const save = () => {
    if (reactFlow) {
      localStorage.setItem(
        REACT_FLOW_LOCAL_STORAGE_KEY,
        JSON.stringify(reactFlow.toObject())
      );
    }
  };

  // Auto save.
  const isSavingReactFlow = useDebouncedEffect(
    save,
    1000, // 1 second.
    [reactFlow, nodes, edges]
  );

  // Auto restore on load.
  useEffect(() => {
    if (reactFlow) {
      const rawFlow = localStorage.getItem(REACT_FLOW_LOCAL_STORAGE_KEY);

      const flow: ReactFlowJsonObject = rawFlow ? JSON.parse(rawFlow) : null;

      // Get the content of the newTreeWith query param.
      const content = getQueryParam(NEW_TREE_CONTENT_QUERY_PARAM);

      if (flow) {
        setEdges(flow.edges || []);
        setViewport(flow.viewport);

        const nodes = flow.nodes; // For brevity.

        if (nodes.length > 0) {
          // Either the first selected node we find, or the first node in the array.
          const toSelect = nodes.find((node) => node.selected)?.id ?? nodes[0].id;

          // Add the nodes to the React Flow array and select the node.
          selectNode(toSelect, () => nodes);

          // If there was a newTreeWith query param, create a new tree with that content.
          // We pass false for forceAutoZoom because we'll do it 500ms later to avoid lag.
          if (content) newUserNodeLinkedToANewSystemNode(content, false);
        } else newUserNodeLinkedToANewSystemNode(content, false); // Create a new node if there are none.
      } else newUserNodeLinkedToANewSystemNode(content, false); // Create a new node if there are none.

      setTimeout(() => {
        // Do this with a more generous timeout to make sure
        // the nodes are rendered and the settings have loaded in.
        if (settings.autoZoom) fitView(FIT_VIEW_SETTINGS);
      }, 500);

      resetURL(); // Get rid of the query params.
    }
  }, [reactFlow]);

  /*//////////////////////////////////////////////////////////////
                          AI PROMPT CALLBACKS
  //////////////////////////////////////////////////////////////*/

  // Takes a prompt, submits it to the GPT API with n responses,
  // then creates a child node for each response under the selected node.
  const submitPrompt = async () => {
    takeSnapshot();

    const temp = settings.temp;

    const parentNodeLineage = selectedNodeLineage;
    const parentNode = selectedNodeLineage[0];

    const newNodes = [...nodes];

    const currentNode = getFluxNode(newNodes, parentNode.id)!;
    const currentNodeChildren = getFluxNodeGPTChildren(newNodes, edges, parentNode.id);

    let firstCompletionId: string | undefined;

    setActiveModels((prev) => {
      const lmeow = prev.filter((meow) => !selectedModels.includes(meow));
      return lmeow;
    });

    const responses = activeModels.length;

    for (let i = 0; i < responses; i++) {
      const model: string = activeModels[i];
      const id = generateNodeId();
      const streamId = generateStreamId();

      if (i === 0) firstCompletionId = id;

      // create a new node.
      newNodes.push(
        newFluxNode({
          id,
          // Position it 50px below the current node, offset
          // horizontally according to the number of responses
          // such that the middle response is right below the current node.
          // Note that node x y coords are the top left corner of the node,
          // so we need to offset by at the width of the node (150px).
          x:
            (currentNodeChildren.length > 0
              ? // If there are already children we want to put the
                // next child to the right of the furthest right one.
                currentNodeChildren.reduce((prev, current) =>
                  prev.position.x > current.position.x ? prev : current
                ).position.x +
                (responses / 2) * 180 +
                90
              : currentNode.position.x) +
            (i - (responses - 1) / 2) * 180,
          // Add OVERLAP_RANDOMNESS_MAX of randomness to the y position so that nodes don't overlap.
          y: currentNode.position.y + 100 + Math.random() * OVERLAP_RANDOMNESS_MAX,
          fluxNodeType: FluxNodeType.GPT,
          text: "",
          streamId: streamId,
        })
      );

      if (model === "gpt-3.5-turbo" || model === "gpt-4") {
        (async () => {
          const stream = await OpenAIStreams(
            "chat",
            {
              model,
              n: 1,
              temperature: temp,
              messages: messagesFromLineage(parentNodeLineage, settings),
            },
            { apiKey: openAiApiKey!, mode: "raw" }
          );
          const DECODER = new TextDecoder();
          const abortController = new AbortController();
          for await (const chunk of yieldStream(stream)) {
            if (abortController.signal.aborted) break;
            try {
              const decoded = JSON.parse(DECODER.decode(chunk));
              if (decoded.choices === undefined)
                throw new Error(
                  "No choices in response. Decoded response: " + JSON.stringify(decoded)
                );
              const choice: CreateChatCompletionStreamResponseChoicesInner =
                decoded.choices[0];
              if (choice.index === undefined)
                throw new Error(
                  "No index in choice. Decoded choice: " + JSON.stringify(choice)
                );
              // The ChatGPT API will start by returning a
              // choice with only a role delta and no content.
              if (choice.delta?.content) {
                setNodes((newerNodes) => {
                  try {
                    return appendTextToFluxNodeAsGPT(newerNodes, {
                      id: id,
                      text: choice.delta?.content ?? UNDEFINED_RESPONSE_STRING,
                      streamId: streamId, // This will cause a throw if the streamId has changed.
                    });
                  } catch (e: any) {
                    // If the stream id does not match,
                    // it is stale and we should abort.
                    abortController.abort(e.message);
                    return newerNodes;
                  }
                });
              }
              // We cannot return within the loop, and we do
              // not want to execute the code below, so we break.
              if (abortController.signal.aborted) break;
            } catch (err) {
              console.error(err);
            }
          }
        })().catch((err) =>
          toast({
            title: err.toString(),
            status: "error",
            ...TOAST_CONFIG,
          })
        );
      } else {
        const openai = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: huggingFaceApiKey as string,
          defaultHeaders: {
            "HTTP-Referer": "http://127.0.0.1:5173/", // To identify your app. Can be set to localhost for testing
            "X-Title": "promptchain", // Optional. Shows on openrouter.ai
          },
          dangerouslyAllowBrowser: true,
        });

        (async () => {
          const res = await openai.chat.completions.create({
            model: model,
            messages: messagesFromLineage(parentNodeLineage, settings),
            stream: true,
          });

          let text: string = "";
          for await (const part of res) {
            setNodes((newerNodes) => {
              try {
                return appendTextToFluxNodeAsGPT(newerNodes, {
                  id: id,
                  text: part.choices[0]?.delta?.content ?? UNDEFINED_RESPONSE_STRING,
                  streamId: streamId, // This will cause a throw if the streamId has changed.
                });
              } catch (e: any) {
                // If the stream id does not match,
                // it is stale and we should abort.
                console.log(e);
                return newerNodes;
              }
            });
          }
        })().catch((err) =>
          toast({
            title: err.toString(),
            status: "error",
            ...TOAST_CONFIG,
          })
        );
      }

      if (firstCompletionId === undefined) throw new Error("No first completion id!");

      // setNodes((nodes) => setFluxNodeStreamId(nodes, { id: id, streamId: undefined }));

      setEdges((edges) =>
        modifyFluxEdge(edges, {
          source: parentNode.id,
          target: id,
          animated: false,
        })
      );

      setNodes(markOnlyNodeAsSelected(newNodes, firstCompletionId!));
      setLastSelectedNodeId(selectedNodeId);
      setSelectedNodeId(firstCompletionId);

      setEdges((edges) => {
        let newEdges = [...edges];

        // the new nodes are added to the end of the array, so we need to
        // subtract responses from and add i to length of the array to access.
        const childId = newNodes[newNodes.length - responses + i].id;

        // add a new edge.
        newEdges.push(
          newFluxEdge({
            source: parentNode.id,
            target: childId,
            animated: false,
          })
        );

        return newEdges;
      });
    }

    autoZoomIfNecessary();

    if (MIXPANEL_TOKEN) mixpanel.track("Submitted Prompt"); // KPI
  };

  /*//////////////////////////////////////////////////////////////
                          SELECTED NODE LOGIC
  //////////////////////////////////////////////////////////////*/

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [lastSelectedNodeId, setLastSelectedNodeId] = useState<string | null>(null);

  const selectedNodeLineage =
    selectedNodeId !== null ? getFluxNodeLineage(nodes, edges, selectedNodeId) : [];

  /*//////////////////////////////////////////////////////////////
                        NODE MUTATION CALLBACKS
  //////////////////////////////////////////////////////////////*/

  const newUserNodeLinkedToANewSystemNode = (
    text: string | null = "",
    forceAutoZoom: boolean = true
  ) => {
    takeSnapshot();

    const systemId = generateNodeId();
    const userId = generateNodeId();

    selectNode(userId, (nodes) =>
      addUserNodeLinkedToASystemNode(
        nodes,
        settings.defaultPreamble,
        text,
        systemId,
        userId
      )
    );

    setEdges((edges) =>
      addFluxEdge(edges, {
        source: systemId,
        target: userId,
        animated: false,
      })
    );

    if (forceAutoZoom) autoZoom();

    if (MIXPANEL_TOKEN) mixpanel.track("New conversation tree created");
  };

  const newConnectedToSelectedNode = (type: FluxNodeType) => {
    const selectedNode = getFluxNode(nodes, selectedNodeId!);

    if (selectedNode) {
      takeSnapshot();

      const selectedNodeChildren = getFluxNodeChildren(nodes, edges, selectedNodeId!);

      const id = generateNodeId();

      selectNode(id, (nodes) =>
        addFluxNode(nodes, {
          id,
          x:
            selectedNodeChildren.length > 0
              ? // If there are already children we want to put the
                // next child to the right of the furthest right one.
                selectedNodeChildren.reduce((prev, current) =>
                  prev.position.x > current.position.x ? prev : current
                ).position.x + 180
              : selectedNode.position.x,
          // Add OVERLAP_RANDOMNESS_MAX of randomness to
          // the y position so that nodes don't overlap.
          y: selectedNode.position.y + 100 + Math.random() * OVERLAP_RANDOMNESS_MAX,
          fluxNodeType: type,
          text: "",
        })
      );

      setEdges((edges) =>
        addFluxEdge(edges, {
          source: selectedNodeId!,
          target: id,
          animated: false,
        })
      );

      autoZoomIfNecessary();

      if (type === FluxNodeType.User) {
        if (MIXPANEL_TOKEN) mixpanel.track("New user node created");
      } else {
        if (MIXPANEL_TOKEN) mixpanel.track("New system node created");
      }
    }
  };

  const deleteSelectedNodes = () => {
    takeSnapshot();

    const selectedNodes = nodes.filter((node) => node.selected);

    if (
      selectedNodeId && // There's a selected node under the hood.
      (selectedNodes.length === 0 || // There are no selected nodes.
        // There is only one selected node, and it's the selected node.
        (selectedNodes.length === 1 && selectedNodes[0].id === selectedNodeId))
    ) {
      // Try to move to sibling first.
      const hasSibling = moveToRightSibling();

      // If there's no sibling, move to parent.
      if (!hasSibling) moveToParent();

      setNodes((nodes) => deleteFluxNode(nodes, selectedNodeId));
    } else {
      setNodes(deleteSelectedFluxNodes);

      // If any of the selected nodes are the selected node, unselect it.
      if (selectedNodeId && selectedNodes.some((node) => node.id === selectedNodeId)) {
        setLastSelectedNodeId(null);
        setSelectedNodeId(null);
      }
    }

    autoZoomIfNecessary();

    if (MIXPANEL_TOKEN) mixpanel.track("Deleted selected node(s)");
  };

  const onClear = () => {
    if (confirm("Are you sure you want to delete all nodes?")) {
      takeSnapshot();

      setNodes([]);
      setEdges([]);
      setViewport({ x: 0, y: 0, zoom: 1 });

      if (MIXPANEL_TOKEN) mixpanel.track("Deleted everything");
    }
  };

  /*//////////////////////////////////////////////////////////////
                      NODE SELECTION CALLBACKS
  //////////////////////////////////////////////////////////////*/

  const selectNode = (
    id: string,
    computeNewNodes?: (currNodes: Node<FluxNodeData>[]) => Node<FluxNodeData>[]
  ) => {
    setLastSelectedNodeId(selectedNodeId);
    setSelectedNodeId(id);
    setNodes((currNodes) =>
      // If we were passed a computeNewNodes function, use it, otherwise just use the current nodes.
      markOnlyNodeAsSelected(computeNewNodes ? computeNewNodes(currNodes) : currNodes, id)
    );
  };

  const moveToChild = () => {
    const children = getFluxNodeChildren(nodes, edges, selectedNodeId!);

    if (children.length > 0) {
      selectNode(
        lastSelectedNodeId !== null &&
          children.some((node) => node.id == lastSelectedNodeId)
          ? lastSelectedNodeId
          : children[0].id
      );

      if (MIXPANEL_TOKEN) mixpanel.track("Moved to child node");

      return true;
    } else {
      return false;
    }
  };

  const moveToParent = () => {
    const parent = getFluxNodeParent(nodes, edges, selectedNodeId!);

    if (parent) {
      selectNode(parent.id);

      if (MIXPANEL_TOKEN) mixpanel.track("Moved to parent node");

      return true;
    } else {
      return false;
    }
  };

  const moveToLeftSibling = () => {
    const siblings = getFluxNodeSiblings(nodes, edges, selectedNodeId!);

    if (siblings.length > 1) {
      const currentIndex = siblings.findIndex((node) => node.id == selectedNodeId!)!;

      selectNode(siblings[mod(currentIndex - 1, siblings.length)].id);

      if (MIXPANEL_TOKEN) mixpanel.track("Moved to left sibling node");

      return true;
    } else {
      return false;
    }
  };

  const moveToRightSibling = () => {
    const siblings = getFluxNodeSiblings(nodes, edges, selectedNodeId!);

    if (siblings.length > 1) {
      const currentIndex = siblings.findIndex((node) => node.id == selectedNodeId!)!;

      selectNode(siblings[mod(currentIndex + 1, siblings.length)].id);

      if (MIXPANEL_TOKEN) mixpanel.track("Moved to right sibling node");

      return true;
    } else {
      return false;
    }
  };

  /*//////////////////////////////////////////////////////////////
                         SETTINGS MODAL LOGIC
  //////////////////////////////////////////////////////////////*/

  const {
    isOpen: isSettingsModalOpen,
    onOpen: onOpenSettingsModal,
    onClose: onCloseSettingsModal,
    onToggle: onToggleSettingsModal,
  } = useDisclosure();

  const [settings, setSettings] = useState<Settings>(() => {
    const rawSettings = localStorage.getItem(MODEL_SETTINGS_LOCAL_STORAGE_KEY);

    if (rawSettings !== null) {
      return JSON.parse(rawSettings) as Settings;
    } else {
      return DEFAULT_SETTINGS;
    }
  });

  // Auto save.
  const isSavingSettings = useDebouncedEffect(
    () => {
      localStorage.setItem(MODEL_SETTINGS_LOCAL_STORAGE_KEY, JSON.stringify(settings));
    },
    1000, // 1 second.
    [settings]
  );

  /*//////////////////////////////////////////////////////////////
                            API KEY LOGIC
  //////////////////////////////////////////////////////////////*/

  const [openAiApiKey, setOpenAiApiKey] = useLocalStorage<string>(
    OPENAI_API_KEY_LOCAL_STORAGE_KEY
  );

  const [huggingFaceApiKey, setHuggingFaceApiKey] = useLocalStorage<string>(
    HUGGINGFACE_API_KEY_LOCAL_STORAGE_KEY
  );

  // TODO: allow user to input both hf and oai api keys at the start
  // add a button to continue and exit the modal which is activated
  // only when there's alteast one valid api key
  // const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(
  //   isValidAPIKey(openAiApiKey, "oai") || isValidAPIKey(huggingFaceApiKey, "hf")
  //     ? false
  //     : true
  // );

  const [availableModels, setAvailableModels] = useState<string[] | null>(null);

  useEffect(() => {
    // manually adding models to make selection experience easier
    if (isValidOpenAiAPIKey(openAiApiKey)) {
      setAvailableModels((prev) =>
        prev !== null
          ? [...new Set([...prev, "gpt-3.5-turbo", "gpt-4"])]
          : ["gpt-3.5-turbo", "gpt-4"]
      );
    }
    if (isValidHuggingFaceAPIKey(huggingFaceApiKey)) {
      setAvailableModels((prev) =>
        prev !== null
          ? [
              ...new Set([
                ...prev,
                "meta-llama/Llama-2-70b-chat",
                "meta-llama/Llama-2-13b-chat",
              ]),
            ]
          : ["meta-llama/Llama-2-70b-chat", "meta-llama/Llama-2-13b-chat"]
      );
    }
  }, [openAiApiKey, huggingFaceApiKey]);

  const isAnythingSaving = isSavingReactFlow || isSavingSettings;
  const isAnythingLoading = isAnythingSaving || availableModels === null;

  useBeforeunload((event: BeforeUnloadEvent) => {
    // Prevent leaving the page before saving.
    if (isAnythingSaving) event.preventDefault();
  });

  /*//////////////////////////////////////////////////////////////
                      MODEL SELECTION LOGIC
  //////////////////////////////////////////////////////////////*/

  // default models
  const [selectedModels, setSelectedModels] = useState<string[]>(() => {
    if (isValidHuggingFaceAPIKey(huggingFaceApiKey)) {
      return ["meta-llama/Llama-2-13b-chat", "meta-llama/Llama-2-70b-chat"];
    } else if (isValidOpenAiAPIKey(openAiApiKey)) {
      return ["gpt-3.5-turbo", "gpt-4"];
    } else {
      return [];
    }
  });

  // active models
  const [activeModels, setActiveModels] = useState<string[]>([selectedModels[0]]);

  /*//////////////////////////////////////////////////////////////
                        COPY MESSAGES LOGIC
  //////////////////////////////////////////////////////////////*/

  const copyMessagesToClipboard = async () => {
    const messages = promptFromLineage(selectedNodeLineage, settings);

    if (await copySnippetToClipboard(messages)) {
      toast({
        title: "Copied messages to clipboard!",
        status: "success",
        ...TOAST_CONFIG,
      });

      if (MIXPANEL_TOKEN) mixpanel.track("Copied messages to clipboard");
    } else {
      toast({
        title: "Failed to copy messages to clipboard!",
        status: "error",
        ...TOAST_CONFIG,
      });
    }
  };

  /*//////////////////////////////////////////////////////////////
                         RENAME NODE LOGIC
  //////////////////////////////////////////////////////////////*/

  const showRenameInput = () => {
    const selectedNode = nodes.find((node) => node.selected);
    const nodeId = selectedNode?.id ?? selectedNodeId;

    if (nodeId) {
      takeSnapshot();

      setNodes((nodes) =>
        modifyReactFlowNodeProperties(nodes, {
          id: nodeId,
          type: ReactFlowNodeTypes.LabelUpdater,
          draggable: false,
        })
      );

      if (MIXPANEL_TOKEN) mixpanel.track("Triggered rename input");
    }
  };

  /*//////////////////////////////////////////////////////////////
                        WINDOW RESIZE LOGIC
  //////////////////////////////////////////////////////////////*/

  useDebouncedWindowResize(autoZoomIfNecessary, 100);

  /*//////////////////////////////////////////////////////////////
                        CHAT RESIZE LOGIC
  //////////////////////////////////////////////////////////////*/

  const [savedChatSize, setSavedChatSize] = useLocalStorage<string>(
    SAVED_CHAT_SIZE_LOCAL_STORAGE_KEY
  );

  /*//////////////////////////////////////////////////////////////
                          HOTKEYS LOGIC
  //////////////////////////////////////////////////////////////*/

  const modifierKey = getPlatformModifierKey();
  const modifierKeyText = getPlatformModifierKeyText();

  useHotkeys(`${modifierKey}+s`, save, HOTKEY_CONFIG);

  useHotkeys(
    `${modifierKey}+p`,
    () => newConnectedToSelectedNode(FluxNodeType.User),
    HOTKEY_CONFIG
  );
  useHotkeys(
    `${modifierKey}+u`,
    () => newConnectedToSelectedNode(FluxNodeType.System),
    HOTKEY_CONFIG
  );

  useHotkeys(
    `${modifierKey}+shift+p`,
    () => newUserNodeLinkedToANewSystemNode(),
    HOTKEY_CONFIG
  );

  useHotkeys(`${modifierKey}+.`, trackedAutoZoom, HOTKEY_CONFIG);
  useHotkeys(
    `${modifierKey}+/`,
    () => {
      onToggleSettingsModal();

      if (MIXPANEL_TOKEN) mixpanel.track("Toggled settings modal");
    },
    HOTKEY_CONFIG
  );
  useHotkeys(`${modifierKey}+shift+backspace`, onClear, HOTKEY_CONFIG);

  useHotkeys(`${modifierKey}+z`, undo, HOTKEY_CONFIG);
  useHotkeys(`${modifierKey}+shift+z`, redo, HOTKEY_CONFIG);

  useHotkeys(`${modifierKey}+e`, showRenameInput, HOTKEY_CONFIG);

  useHotkeys(`${modifierKey}+up`, moveToParent, HOTKEY_CONFIG);
  useHotkeys(`${modifierKey}+down`, moveToChild, HOTKEY_CONFIG);
  // useHotkeys(`${modifierKey}+left`, moveToLeftSibling, HOTKEY_CONFIG);
  // useHotkeys(`${modifierKey}+right`, moveToRightSibling, HOTKEY_CONFIG);
  useHotkeys(`${modifierKey}+return`, () => submitPrompt(), HOTKEY_CONFIG);
  useHotkeys(`${modifierKey}+shift+delete`, deleteSelectedNodes, HOTKEY_CONFIG);
  useHotkeys(`${modifierKey}+shift+c`, copyMessagesToClipboard, HOTKEY_CONFIG);

  /*//////////////////////////////////////////////////////////////
                              APP
  //////////////////////////////////////////////////////////////*/

  return (
    <>
      {!(
        isValidOpenAiAPIKey(openAiApiKey) || isValidHuggingFaceAPIKey(huggingFaceApiKey)
      ) && (
        <APIKeyModal
          openAiApiKey={openAiApiKey}
          setOpenAiApiKey={setOpenAiApiKey}
          huggingFaceApiKey={huggingFaceApiKey}
          setHuggingFaceApiKey={setHuggingFaceApiKey}
        />
      )}

      <SettingsModal
        settings={settings}
        setSettings={setSettings}
        isOpen={isSettingsModalOpen}
        onClose={onCloseSettingsModal}
        openAiApiKey={openAiApiKey}
        setOpenAiApiKey={setOpenAiApiKey}
        huggingFaceApiKey={huggingFaceApiKey}
        setHuggingFaceApiKey={setHuggingFaceApiKey}
        availableModels={availableModels}
        selectedModels={selectedModels}
        setSelectedModels={setSelectedModels}
      />
      <Column
        mainAxisAlignment="center"
        crossAxisAlignment="center"
        height="100vh"
        width="100%"
      >
        <Row mainAxisAlignment="flex-start" crossAxisAlignment="stretch" expand>
          <Resizable
            maxWidth="70%"
            minWidth="0%"
            defaultSize={{
              // Defaults to the previously used chat size if it exists.
              width: savedChatSize || "50%",
              height: "auto",
            }}
            enable={{
              top: false,
              right: true,
              bottom: false,
              left: false,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false,
            }}
            onResizeStop={(_, __, ref) => {
              setSavedChatSize(ref.style.width);
              autoZoomIfNecessary();

              if (MIXPANEL_TOKEN) mixpanel.track("Resized chat window");
            }}
          >
            <Column
              mainAxisAlignment="center"
              crossAxisAlignment="center"
              borderRightColor="#EEEEEE"
              borderRightWidth="1px"
              expand
            >
              <Row
                mainAxisAlignment="space-between"
                crossAxisAlignment="center"
                width="100%"
                height="50px"
                px="20px"
                borderBottomColor="#EEEEEE"
                borderBottomWidth="1px"
              >
                <NavigationBar
                  newUserNodeLinkedToANewSystemNode={() =>
                    newUserNodeLinkedToANewSystemNode()
                  }
                  newConnectedToSelectedNode={newConnectedToSelectedNode}
                  deleteSelectedNodes={deleteSelectedNodes}
                  submitPrompt={() => submitPrompt()}
                  undo={undo}
                  redo={redo}
                  onClear={onClear}
                  copyMessagesToClipboard={copyMessagesToClipboard}
                  showRenameInput={showRenameInput}
                  moveToParent={moveToParent}
                  moveToChild={moveToChild}
                  moveToLeftSibling={moveToLeftSibling}
                  moveToRightSibling={moveToRightSibling}
                  autoZoom={trackedAutoZoom}
                  onOpenSettingsModal={() => {
                    onOpenSettingsModal();

                    if (MIXPANEL_TOKEN) mixpanel.track("Opened Settings Modal"); // KPI
                  }}
                />

                <Box ml="20px">
                  {isAnythingLoading ? (
                    <Spinner size="sm" mt="6px" color={"#404040"} />
                  ) : (
                    <CheckCircleIcon color={"#404040"} />
                  )}
                </Box>
              </Row>

              <ReactFlow
                proOptions={{ hideAttribution: true }}
                nodes={nodes}
                maxZoom={1.5}
                minZoom={0}
                edges={edges}
                onInit={setReactFlow}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onEdgesDelete={takeSnapshot}
                onNodesDelete={takeSnapshot}
                onEdgeUpdateStart={onEdgeUpdateStart}
                onEdgeUpdate={onEdgeUpdate}
                onEdgeUpdateEnd={onEdgeUpdateEnd}
                onConnect={onConnect}
                nodeTypes={REACT_FLOW_NODE_TYPES}
                onSelectionDragStop={autoZoomIfNecessary}
                selectionKeyCode={null}
                multiSelectionKeyCode="Shift"
                panActivationKeyCode="Shift"
                deleteKeyCode={null}
                panOnDrag={allowPanOnDrag}
                selectionOnDrag={!allowPanOnDrag}
                zoomOnScroll={true}
                zoomActivationKeyCode={null}
                selectionMode={SelectionMode.Partial}
                onNodeClick={(_, node) => {
                  setLastSelectedNodeId(selectedNodeId);
                  setSelectedNodeId(node.id);
                }}
              >
                <Background />
              </ReactFlow>
            </Column>
          </Resizable>

          <Box height="100%" width="100%" overflowY="scroll" p={4}>
            {selectedNodeLineage.length >= 1 ? (
              <Prompt
                selectedModels={selectedModels}
                activeModels={activeModels}
                setActiveModels={setActiveModels}
                selectedNodeId={selectedNodeId}
                settings={settings}
                setSettings={setSettings}
                selectNode={selectNode}
                newConnectedToSelectedNode={newConnectedToSelectedNode}
                lineage={selectedNodeLineage}
                onType={(text: string) => {
                  takeSnapshot();
                  setNodes((nodes) =>
                    modifyFluxNodeText(nodes, {
                      asHuman: true,
                      id: selectedNodeId!,
                      text,
                    })
                  );
                }}
                submitPrompt={() => submitPrompt()}
                apiKey={openAiApiKey}
              />
            ) : (
              <Column
                expand
                textAlign="center"
                mainAxisAlignment={"center"}
                crossAxisAlignment={"center"}
              >
                <BigButton
                  tooltip={`⇧${modifierKeyText}P`}
                  width="400px"
                  height="100px"
                  fontSize="xl"
                  onClick={() => newUserNodeLinkedToANewSystemNode()}
                  color={getFluxNodeTypeDarkColor(FluxNodeType.GPT)}
                >
                  Create a new conversation tree
                </BigButton>
              </Column>
            )}
          </Box>
        </Row>
      </Column>
    </>
  );
}

export default App;
