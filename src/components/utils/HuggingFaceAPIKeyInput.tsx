import { BoxProps } from "@chakra-ui/react";
import { LabeledPasswordInputWithLink } from "./LabeledInputs";

export function HuggingFaceAPIKeyInput({
  apiKey,
  setApiKey,
  ...others
}: {
  apiKey: string | null;
  setApiKey: (apiKey: string) => void;
} & BoxProps) {
  return (
    <LabeledPasswordInputWithLink
      width="80%"
      label="OpenRouter API Key"
      linkLabel="Get a key"
      placeholder="sk-or-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
      link="https://openrouter.ai/keys"
      value={apiKey ?? ""}
      setValue={setApiKey}
      {...others}
    />
  );
}
