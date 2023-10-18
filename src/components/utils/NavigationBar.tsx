import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuGroup,
  MenuItem,
  MenuDivider,
  Box,
  Text,
  Avatar,
  AvatarGroup,
  Link,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

import { Row } from "../../utils/chakra";
import { FluxNodeType } from "../../utils/types";
import { getPlatformModifierKeyText } from "../../utils/platform";

export function NavigationBar({
  newUserNodeLinkedToANewSystemNode,
  newConnectedToSelectedNode,
  submitPrompt,
  undo,
  redo,
  onClear,
  copyMessagesToClipboard,
  showRenameInput,
  deleteSelectedNodes,
  moveToParent,
  moveToChild,
  moveToLeftSibling,
  moveToRightSibling,
  autoZoom,
  onOpenSettingsModal,
}: {
  newUserNodeLinkedToANewSystemNode: () => void;
  newConnectedToSelectedNode: (nodeType: FluxNodeType) => void;
  submitPrompt: () => void;
  deleteSelectedNodes: () => void;
  undo: () => void;
  redo: () => void;
  onClear: () => void;
  copyMessagesToClipboard: () => void;
  showRenameInput: () => void;
  moveToParent: () => void;
  moveToChild: () => void;
  moveToLeftSibling: () => void;
  moveToRightSibling: () => void;
  autoZoom: () => void;
  onOpenSettingsModal: () => void;
}) {
  const modifierKeyText = getPlatformModifierKeyText();

  return (
    <Row
      mainAxisAlignment="flex-start"
      crossAxisAlignment="center"
      height="100%"
      width="auto"
      overflowX="auto"
    >
      <Row
        mainAxisAlignment="flex-start"
        crossAxisAlignment="center"
        height="100%"
        width="auto"
      >
        <Text whiteSpace="nowrap">
          <b>Promptchain</b>
        </Text>

        <Box mx="20px" height="100%" width="1px" bg="#EEEEEE" />

        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            variant="ghost"
            height="80%"
            px="15px"
          >
            File
          </MenuButton>
          <MenuList width="300px">
            <MenuGroup title="Trees">
              <MenuItem
                command={`⇧${modifierKeyText}P`}
                onClick={newUserNodeLinkedToANewSystemNode}
              >
                New conversation tree
              </MenuItem>
            </MenuGroup>

            <MenuDivider />

            <MenuGroup title="Nodes">
              <MenuItem
                command={`${modifierKeyText}P`}
                onClick={() => newConnectedToSelectedNode(FluxNodeType.User)}
              >
                New user node
              </MenuItem>

              <MenuItem
                command={`${modifierKeyText}U`}
                onClick={() => newConnectedToSelectedNode(FluxNodeType.System)}
              >
                New system node
              </MenuItem>
            </MenuGroup>

            <MenuDivider />

            <MenuGroup title="Model">
              <MenuItem command={`${modifierKeyText}⏎`} onClick={submitPrompt}>
                Generate model responses
              </MenuItem>
            </MenuGroup>
          </MenuList>
        </Menu>
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            variant="ghost"
            height="80%"
            px="15px"
            ml="11px"
          >
            Edit
          </MenuButton>
          <MenuList width="300px">
            <MenuGroup title="History">
              <MenuItem command={`${modifierKeyText}Z`} onClick={undo}>
                Undo
              </MenuItem>

              <MenuItem command={`⇧${modifierKeyText}Z`} onClick={redo}>
                Redo
              </MenuItem>
            </MenuGroup>

            <MenuDivider />

            <MenuGroup title="Delete">
              <MenuItem
                command={`⇧${modifierKeyText} Del`}
                onClick={deleteSelectedNodes}
              >
                Delete selected node(s)
              </MenuItem>
            </MenuGroup>

            <MenuDivider />

            <MenuGroup title="Rename">
              <MenuItem command={`${modifierKeyText}E`} onClick={showRenameInput}>
                Rename selected node
              </MenuItem>
            </MenuGroup>

            <MenuDivider />

            <MenuGroup title="Copy">
              <MenuItem
                command={`⇧${modifierKeyText}C`}
                onClick={copyMessagesToClipboard}
              >
                Copy messages to clipboard
              </MenuItem>
            </MenuGroup>
          </MenuList>
        </Menu>
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            variant="ghost"
            height="80%"
            px="15px"
            ml="11px"
          >
            Navigate
          </MenuButton>
          <MenuList width="300px">
            <MenuGroup title="Parents/Children">
              <MenuItem command={`${modifierKeyText}↑`} onClick={moveToParent}>
                Up to parent node
              </MenuItem>
              <MenuItem command={`${modifierKeyText}↓`} onClick={moveToChild}>
                Down to child node
              </MenuItem>
            </MenuGroup>

            <MenuDivider />

            <MenuGroup title="Siblings">
              <MenuItem command={`${modifierKeyText}←`} onClick={moveToLeftSibling}>
                Left to sibling node
              </MenuItem>
              <MenuItem command={`${modifierKeyText}→`} onClick={moveToRightSibling}>
                Right to sibling node
              </MenuItem>
            </MenuGroup>

            <MenuDivider />

            <MenuGroup title="Global">
              <MenuItem command={`${modifierKeyText}.`} onClick={autoZoom}>
                Zoom out & center
              </MenuItem>
            </MenuGroup>
          </MenuList>
        </Menu>
        <Button
          variant="ghost"
          height="80%"
          px="15px"
          ml="11px"
          onClick={onOpenSettingsModal}
        >
          Settings
        </Button>
      </Row>
    </Row>
  );
}
