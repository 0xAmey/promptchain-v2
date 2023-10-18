import { Button, Tooltip, Box, Text } from "@chakra-ui/react";
import { NodeToolbar, Handle, getBezierPath } from "reactflow";
import { Position } from "reactflow";
import { Column, Row } from "../../utils/chakra";
import { FluxNodeData } from "../../utils/types";
import { Markdown } from "../utils/Markdown";
import { formatAutoLabel } from "../../utils/prompt";
import { useReactFlow } from "reactflow";
import { useState, useEffect } from "react";
import { useDebouncedEffect } from "../../utils/debounce";

export function ModelNode({
  model,
  id,
  data,
  isConnectable,
}: {
  model?: string;
  id: string;
  data: FluxNodeData;
  isConnectable: boolean;
}) {
  const { getZoom } = useReactFlow();
  const [currentZoom, setCurrentZoom] = useState(getZoom());
  const keepSettingZoom = () => setCurrentZoom(getZoom());
  useDebouncedEffect(keepSettingZoom, 1000, [getZoom()]);
  return (
    <Box
      width="150px"
      height="38px"
      fontSize={"0.67em"}
      textAlign={"center"}
      verticalAlign={"center"}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

      <Box alignItems={"center"} justifyContent={"center"} padding={"10px"}>
        <Markdown text={formatAutoLabel(data.text)} />
      </Box>

      <NodeToolbar isVisible={true} position={Position.Bottom}>
        <Text fontSize={`${60 / Math.pow(5, 1 / currentZoom)}px`}>
          {data.model?.includes("meta-llama/")
            ? data.model.replace("meta-llama/", "")
            : data.model}
        </Text>
      </NodeToolbar>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </Box>
  );
}
