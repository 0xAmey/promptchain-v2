import { MIXPANEL_TOKEN } from "../main";
import { Row, Center, Column } from "../utils/chakra";
import { getFluxNodeTypeColor, getFluxNodeTypeDarkColor } from "../utils/color";
import { setFluxNodeStreamId } from "../utils/fluxNode";
import { FluxNodeData, FluxNodeType, Settings } from "../utils/types";
import { BigButton } from "./utils/BigButton";
import { LabeledSlider } from "./utils/LabeledInputs";
import { Markdown } from "./utils/Markdown";
import { EditIcon, ViewIcon, NotAllowedIcon } from "@chakra-ui/icons";
import { Spinner, Text, Button, flexbox, Box, Flex } from "@chakra-ui/react";
import mixpanel from "mixpanel-browser";
import React, { useState, useEffect, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Node, useReactFlow } from "reactflow";
import { getPlatformModifierKeyText } from "../utils/platform";
import { Whisper } from "./utils/Whisper";
import ButtonGrid from "./utils/ButtonGrid";

export function Prompt({
  selectedModels,
  activeModels,
  setActiveModels,
  selectedNodeId,
  lineage,
  submitPrompt,
  onType,
  selectNode,
  newConnectedToSelectedNode,
  settings,
  setSettings,
  apiKey,
}: {
  selectedModels: string[];
  activeModels: string[];
  setActiveModels: React.Dispatch<React.SetStateAction<string[]>>;
  selectedNodeId: string | null;
  lineage: Node<FluxNodeData>[];
  onType: (text: string) => void;
  submitPrompt: () => Promise<void>;
  selectNode: (id: string) => void;
  newConnectedToSelectedNode: (type: FluxNodeType) => void;
  settings: Settings;
  setSettings: (settings: Settings) => void;
  apiKey: string | null;
}) {
  const { setNodes } = useReactFlow();

  const promptNode = lineage[0];

  const promptNodeType = promptNode.data.fluxNodeType;

  const onMainButtonClick = () => {
    if (promptNodeType === FluxNodeType.User) {
      submitPrompt();
    } else {
      newConnectedToSelectedNode(FluxNodeType.User);
    }
  };

  const stopGenerating = () => {
    // Reset the stream id.
    setNodes((nodes) =>
      setFluxNodeStreamId(nodes, { id: promptNode.id, streamId: undefined })
    );

    if (MIXPANEL_TOKEN) mixpanel.track("Stopped generating response");
  };

  /*//////////////////////////////////////////////////////////////
                              STATE
  //////////////////////////////////////////////////////////////*/

  const [isEditing, setIsEditing] = useState(
    promptNodeType === FluxNodeType.User || promptNodeType === FluxNodeType.System
  );
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  /*//////////////////////////////////////////////////////////////
                              EFFECTS
  //////////////////////////////////////////////////////////////*/

  const textOffsetRef = useRef<number>(-1);

  // Scroll to the prompt buttons
  // when the bottom node is swapped.
  useEffect(() => {
    window.document
      .getElementById("promptButtons")
      ?.scrollIntoView(/* { behavior: "smooth" } */);

    // If the user clicked on the node, we assume they want to edit it.
    // Otherwise, we only put them in edit mode if its a user or system node.
    setIsEditing(
      textOffsetRef.current !== -1 ||
        promptNodeType === FluxNodeType.User ||
        promptNodeType === FluxNodeType.System
    );
  }, [promptNode.id]);

  // Focus the textbox when the user changes into edit mode.
  useEffect(() => {
    if (isEditing) {
      const promptBox = window.document.getElementById(
        "promptBox"
      ) as HTMLTextAreaElement | null;

      // Focus the text box and move the cursor to chosen offset (defaults to end).
      promptBox?.setSelectionRange(textOffsetRef.current, textOffsetRef.current);
      promptBox?.focus();

      // Default to moving to the end of the text.
      textOffsetRef.current = -1;
    }
  }, [promptNode.id, isEditing]);

  /*//////////////////////////////////////////////////////////////
                              APP
  //////////////////////////////////////////////////////////////*/

  const modifierKeyText = getPlatformModifierKeyText();

  return (
    <Box
      position={"relative"}
      paddingLeft={"15px"}
      paddingRight={"15px"}
      paddingBottom={"50px"}
    >
      <ButtonGrid
        selectedModels={selectedModels}
        activeModels={activeModels}
        setActiveModels={setActiveModels}
      />

      {/* Display clickable buttons for 4 different models */}
      {lineage
        .slice()
        .reverse()
        .map((node, i) => {
          const isLast = i === lineage.length - 1;
          const data = node.data;

          if (
            node.data.fluxNodeType === FluxNodeType.System &&
            node.id === selectedNodeId
          ) {
            return (
              <Box display="flex" flexDirection="column" alignItems="center">
                <Row
                  mb={2}
                  p={3}
                  mainAxisAlignment="flex-start"
                  crossAxisAlignment="flex-start"
                  borderRadius="25px"
                  _hover={{
                    boxShadow: isLast ? "none" : "0 0 0 0.5px #1a192b",
                  }}
                  padding={"20px"}
                  width={"80%"}
                  borderColor={getFluxNodeTypeDarkColor(data.fluxNodeType)}
                  position="relative"
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  bg={getFluxNodeTypeColor(data.fluxNodeType)}
                  key={node.id}
                  onClick={() => {
                    const selection = window.getSelection();

                    // We don't want to trigger the selection
                    // if they're just selecting/copying text.
                    if (selection?.isCollapsed) {
                      if (isLast) {
                        if (data.streamId) {
                          stopGenerating();
                          setIsEditing(true);
                        } else if (!isEditing) setIsEditing(true);
                      } else {
                        // TODO: Note this is basically broken because of codeblocks.
                        textOffsetRef.current = selection.anchorOffset ?? 0;

                        selectNode(node.id);
                        setIsEditing(true);
                      }
                    }
                  }}
                  cursor={isLast && isEditing ? "text" : "pointer"}
                >
                  <>
                    <Button
                      display={
                        hoveredNodeId === promptNode.id && promptNode.id === node.id
                          ? "block"
                          : "none"
                      }
                      onClick={() =>
                        data.streamId ? stopGenerating() : setIsEditing(!isEditing)
                      }
                      position="absolute"
                      top={1}
                      right={1}
                      zIndex={10}
                      variant="outline"
                      border="0px"
                      p={1}
                      _hover={{ background: "none" }}
                    >
                      {data.streamId ? (
                        <NotAllowedIcon boxSize={4} />
                      ) : isEditing ? (
                        <ViewIcon boxSize={4} />
                      ) : (
                        <EditIcon boxSize={4} />
                      )}
                    </Button>
                    <Column
                      width="100%"
                      marginRight="30px"
                      whiteSpace="pre-wrap" // Preserve newlines.
                      mainAxisAlignment="flex-start"
                      crossAxisAlignment="flex-start"
                      borderRadius="6px"
                      wordBreak="break-word"
                    >
                      {isLast && isEditing ? (
                        <>
                          <TextareaAutosize
                            id="promptBox"
                            style={{
                              width: "100%",
                              backgroundColor: "transparent",
                              outline: "none",
                            }}
                            value={data.text ?? ""}
                            onChange={(e) => onType(e.target.value)}
                            placeholder={
                              data.fluxNodeType === FluxNodeType.User
                                ? "Write a poem about..."
                                : data.fluxNodeType === FluxNodeType.System
                                ? "You are ChatGPT..."
                                : undefined
                            }
                          />
                          {data.fluxNodeType === FluxNodeType.User && (
                            <Whisper
                              onConvertedText={(text: string) =>
                                onType(`${data.text}${data.text ? " " : ""}${text}`)
                              }
                              apiKey={apiKey}
                            />
                          )}
                        </>
                      ) : (
                        <Markdown text={data.text} />
                      )}
                    </Column>
                  </>
                </Row>
              </Box>
            );
          } else if (node.data.fluxNodeType === FluxNodeType.System) {
            return;
          }

          return (
            <Box
              display="flex"
              flexDirection="column"
              alignItems={
                data.fluxNodeType === FluxNodeType.User ? "flex-start" : "flex-end"
              }
            >
              <Row
                mb={2}
                p={3}
                mainAxisAlignment="flex-start"
                crossAxisAlignment="flex-start"
                borderRadius="25px"
                _hover={{
                  boxShadow: isLast ? "none" : "0 0 0 0.5px #1a192b",
                }}
                padding={"20px"}
                width={"100%"}
                minWidth={"40%"}
                maxWidth={"70%"}
                borderColor={getFluxNodeTypeDarkColor(data.fluxNodeType)}
                position="relative"
                justifyContent={
                  data.fluxNodeType == FluxNodeType.Model ? "left" : "right"
                }
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                bg={getFluxNodeTypeColor(data.fluxNodeType)}
                key={node.id}
                onClick={() => {
                  const selection = window.getSelection();

                  // We don't want to trigger the selection
                  // if they're just selecting/copying text.
                  if (selection?.isCollapsed) {
                    if (isLast) {
                      if (data.streamId) {
                        stopGenerating();
                        setIsEditing(true);
                      } else if (!isEditing) setIsEditing(true);
                    } else {
                      // TODO: Note this is basically broken because of codeblocks.
                      textOffsetRef.current = selection.anchorOffset ?? 0;

                      selectNode(node.id);
                      setIsEditing(true);
                    }
                  }
                }}
                cursor={isLast && isEditing ? "text" : "pointer"}
              >
                <>
                  <Button
                    display={
                      hoveredNodeId === promptNode.id && promptNode.id === node.id
                        ? "block"
                        : "none"
                    }
                    onClick={() =>
                      data.streamId ? stopGenerating() : setIsEditing(!isEditing)
                    }
                    position="absolute"
                    top={1}
                    right={1}
                    zIndex={10}
                    variant="outline"
                    border="0px"
                    p={1}
                    _hover={{ background: "none" }}
                  >
                    {data.streamId ? (
                      <NotAllowedIcon boxSize={4} />
                    ) : isEditing ? (
                      <ViewIcon boxSize={4} />
                    ) : (
                      <EditIcon boxSize={4} />
                    )}
                  </Button>
                  <Column
                    width="100%"
                    marginRight="30px"
                    whiteSpace="pre-wrap" // Preserve newlines.
                    mainAxisAlignment="flex-start"
                    crossAxisAlignment="flex-start"
                    borderRadius="6px"
                    wordBreak="break-word"
                    minHeight={
                      data.fluxNodeType === FluxNodeType.User && isLast && isEditing
                        ? "75px"
                        : "0px"
                    }
                  >
                    {isLast && isEditing ? (
                      <>
                        <TextareaAutosize
                          id="promptBox"
                          style={{
                            width: "100%",
                            backgroundColor: "transparent",
                            outline: "none",
                          }}
                          minRows={data.fluxNodeType === FluxNodeType.User ? 3 : 1}
                          value={data.text ?? ""}
                          onChange={(e) => onType(e.target.value)}
                          placeholder={
                            data.fluxNodeType === FluxNodeType.User
                              ? "Write a poem about..."
                              : data.fluxNodeType === FluxNodeType.System
                              ? "You are ChatGPT..."
                              : undefined
                          }
                        />
                        {data.fluxNodeType === FluxNodeType.User && (
                          <Whisper
                            onConvertedText={(text: string) =>
                              onType(`${data.text}${data.text ? " " : ""}${text}`)
                            }
                            apiKey={apiKey}
                          />
                        )}
                      </>
                    ) : (
                      <Markdown text={data.text} />
                    )}
                  </Column>
                </>
              </Row>
            </Box>
          );
        })}
    </Box>
  );
}
