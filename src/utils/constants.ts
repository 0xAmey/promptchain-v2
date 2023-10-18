import { UseToastOptions } from "@chakra-ui/toast";

import { Options } from "react-hotkeys-hook";

import { ReactFlowNodeTypes, Settings, FluxNodeData } from "./types";

import { LabelUpdaterNode } from "../components/nodes/LabelUpdaterNode";
import { ModelNode } from "../components/nodes/ModelNode";

type NodeProps<T = {}> = T & {
  id: string;
  data: FluxNodeData;
  isConnectable: boolean;
};

export const REACT_FLOW_NODE_TYPES: Record<
  ReactFlowNodeTypes,
  (args: NodeProps) => JSX.Element
> = {
  LabelUpdater: LabelUpdaterNode,
  Model: ModelNode,
};

export const DEFAULT_SETTINGS: Settings = {
  temp: 1.2,
  activeModels: ["gpt-3.5-turbo"],
  selectedModels: ["gpt-3.5-turbo"],
  autoZoom: true,
  defaultPreamble: `You are a helpful AI assistant`,
};

export const HOTKEY_CONFIG: Options = {
  preventDefault: true,
  enableOnFormTags: true,
};

export const TOAST_CONFIG: UseToastOptions = {
  isClosable: true,
  variant: "left-accent",
  position: "bottom-left",
};

export const MAX_HISTORY_SIZE = 256;

export const OVERLAP_RANDOMNESS_MAX = 20;

export const OPENAI_API_KEY_LOCAL_STORAGE_KEY = "PROMPTCHAIN_OPENAI_API_KEY";
export const HUGGINGFACE_API_KEY_LOCAL_STORAGE_KEY = "PROMPTCHAIN_HUGGINGFACE_API_KEY";
export const REACT_FLOW_LOCAL_STORAGE_KEY = "PROMPTCHAIN_REACT_FLOW_DATA";
export const MODEL_SETTINGS_LOCAL_STORAGE_KEY = "PROMPTCHAIN_MODEL_SETTINGS";
export const SAVED_CHAT_SIZE_LOCAL_STORAGE_KEY = "PROMPTCHAIN_SAVED_CHAT_SIZE";

export const NEW_TREE_CONTENT_QUERY_PARAM = "newTreeWith";

export const UNDEFINED_RESPONSE_STRING = "[UNDEFINED RESPONSE]";

export const FIT_VIEW_SETTINGS = { padding: 0.1, duration: 200 };

export const NEW_TREE_X_OFFSET = 600;

export const STREAM_CANCELED_ERROR_MESSAGE = "STREAM_CANCELED";
export const STALE_STREAM_ERROR_MESSAGE = "STALE_STREAM";

// Magic number to almost always make auto-label text stay in two lines.
export const MAX_AUTOLABEL_CHARS = 25;
