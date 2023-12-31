import { Node, Edge } from "reactflow";

export type ChatCompletionResponseMessage = ["role", "content"];

export type FluxNodeData = {
  label: string;
  fluxNodeType: FluxNodeType;
  model?: string;
  text: string;
  streamId?: string;
  hasCustomlabel?: boolean;
};

// have multiple models here
export enum FluxNodeType {
  System = "System",
  User = "User",
  Model = "Model",
  TweakedModel = "Model (tweaked)",
}

export type Settings = {
  defaultPreamble: string;
  activeModels: string[];
  selectedModels: string[];
  autoZoom: boolean;
  temp: number;
};

export enum ReactFlowNodeTypes {
  LabelUpdater = "LabelUpdater",
  Model = "Model",
}

// The stream response is weird and has a delta instead of message field.
export interface CreateChatCompletionStreamResponseChoicesInner {
  index?: number;
  delta?: ChatCompletionResponseMessage;
  finish_reason?: string;
}

export type HistoryItem = {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  lastSelectedNodeId: string | null;
};
