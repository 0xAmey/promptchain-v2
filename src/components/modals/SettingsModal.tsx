import { MIXPANEL_TOKEN } from "../../main";
import { getFluxNodeTypeDarkColor } from "../../utils/color";
import { DEFAULT_SETTINGS } from "../../utils/constants";
import { Settings, FluxNodeType } from "../../utils/types";
import { OpenAiAPIKeyInput } from "../utils/OpenAiAPIKeyInput";

import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Checkbox,
} from "@chakra-ui/react";
import mixpanel from "mixpanel-browser";
import { ChangeEvent, memo } from "react";
import { HuggingFaceAPIKeyInput } from "../utils/HuggingFaceAPIKeyInput";
import ModalCheckboxDropdown from "../utils/ModalCheckboxDropdown";

const selectModelText = "Select a model to add";

export const SettingsModal = memo(function SettingsModal({
  isOpen,
  onClose,
  settings,
  setSettings,
  openAiApiKey,
  setOpenAiApiKey,
  huggingFaceApiKey,
  setHuggingFaceApiKey,
  availableModels,
  selectedModels,
  setSelectedModels,
  setActiveModels,
  activeModels,
}: {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  setSettings: (update: (prevSettings: Settings) => Settings) => void;
  openAiApiKey: string | null;
  setOpenAiApiKey: (openAiApiKey: string) => void;
  huggingFaceApiKey: string | null;
  setHuggingFaceApiKey: (huggingFaceApiKey: string) => void;
  availableModels: string[] | null;
  selectedModels: string[];
  setSelectedModels: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveModels: React.Dispatch<React.SetStateAction<string[]>>;
  activeModels: string[];
}) {
  const reset = () => {
    if (
      confirm(
        "Are you sure you want to reset your settings to default? This cannot be undone!"
      )
    ) {
      setSettings((prev) => DEFAULT_SETTINGS);

      if (MIXPANEL_TOKEN) mixpanel.track("Restored defaults");
    }
  };

  const hardReset = () => {
    if (
      confirm(
        "Are you sure you want to delete ALL data (including your saved API key, conversations, etc?) This cannot be undone!"
      ) &&
      confirm(
        "Are you 100% sure? Reminder this cannot be undone and you will lose EVERYTHING!"
      )
    ) {
      // Clear local storage.
      localStorage.clear();

      // Ensure that the page is reloaded even if there are unsaved changes.
      window.onbeforeunload = null;

      // Reload the window.
      window.location.reload();

      if (MIXPANEL_TOKEN) mixpanel.track("Performed hard reset");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {/* CHECKBOX DROPDOWN */}

          <ModalCheckboxDropdown
            settings={settings}
            setActiveModels={setActiveModels}
            availableModels={availableModels}
            selectedModels={selectedModels}
            setSelectedModels={setSelectedModels}
            setSettings={setSettings}
            activeModels={activeModels}
          />

          <OpenAiAPIKeyInput
            mt={4}
            width="100%"
            apiKey={openAiApiKey}
            setApiKey={setOpenAiApiKey}
          />

          <HuggingFaceAPIKeyInput
            mt={4}
            width={"100%"}
            apiKey={huggingFaceApiKey}
            setApiKey={setHuggingFaceApiKey}
          />
          <Checkbox
            mt={3}
            fontWeight="bold"
            isChecked={settings.autoZoom}
            colorScheme="gray"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setSettings((prev) => {
                return { ...settings, autoZoom: event.target.checked };
              });

              if (MIXPANEL_TOKEN) mixpanel.track("Changed auto zoom");
            }}
          >
            Auto Zoom
          </Checkbox>
        </ModalBody>

        <ModalFooter>
          <Button mb={2} onClick={reset} mr={3} color="orange">
            Restore Defaults
          </Button>

          <Button mb={2} onClick={hardReset} mr="auto" color="red">
            Hard Reset
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
