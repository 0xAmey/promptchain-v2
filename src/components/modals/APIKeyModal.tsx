import mixpanel from "mixpanel-browser";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  Link,
  Text,
  LinkOverlay,
  color,
} from "@chakra-ui/react";

import { MIXPANEL_TOKEN } from "../../main";

import { Column } from "../../utils/chakra";
import { isValidOpenAiAPIKey, isValidHuggingFaceAPIKey } from "../../utils/apikey";
import { OpenAiAPIKeyInput } from "../utils/OpenAiAPIKeyInput";
import { HuggingFaceAPIKeyInput } from "../utils/HuggingFaceAPIKeyInput";

export function APIKeyModal({
  openAiApiKey,
  setOpenAiApiKey,
  huggingFaceApiKey,
  setHuggingFaceApiKey,
}: {
  openAiApiKey: string | null;
  setOpenAiApiKey: (apiKey: string) => void;
  huggingFaceApiKey: string | null;
  setHuggingFaceApiKey: (apiKey: string) => void;
}) {
  const setOpenAiApiKeyTracked = (apiKey: string) => {
    setOpenAiApiKey(apiKey);

    if (isValidOpenAiAPIKey(openAiApiKey)) {
      if (MIXPANEL_TOKEN) mixpanel.track("Entered API Key"); // KPI

      // Hacky way to get the prompt box to focus after the
      // modal closes. Long term should probably use a ref.
      setTimeout(() => window.document.getElementById("promptBox")?.focus(), 50);
    }
  };

  const setHuggingFaceApiKeyTracked = (apiKey: string) => {
    setHuggingFaceApiKey(apiKey);

    if (isValidHuggingFaceAPIKey(openAiApiKey)) {
      if (MIXPANEL_TOKEN) mixpanel.track("Entered API Key"); // KPI

      // Hacky way to get the prompt box to focus after the
      // modal closes. Long term should probably use a ref.
      setTimeout(() => window.document.getElementById("promptBox")?.focus(), 50);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => {}}
      size="3xl"
      isCentered={true}
      motionPreset="none"
    >
      <ModalOverlay />
      <ModalContent>
        <Column mainAxisAlignment="center" crossAxisAlignment="center" height="500px">
          <OpenAiAPIKeyInput apiKey={openAiApiKey} setApiKey={setOpenAiApiKeyTracked} />
          <HuggingFaceAPIKeyInput
            apiKey={huggingFaceApiKey}
            setApiKey={setHuggingFaceApiKeyTracked}
          />
          <Text mt={5} width="80%" textAlign="center" fontSize="md">
            Your API Keys will <b>never</b> leave your browser's local storage. Check for
            yourself{" "}
            <Link
              href={"https://github.com/ameywtf/promptchain-v2"}
              color={"#2E8251"}
              isExternal={true}
            >
              <u>here</u>
            </Link>
          </Text>
        </Column>
      </ModalContent>
    </Modal>
  );
}
