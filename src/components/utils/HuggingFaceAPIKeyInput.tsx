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
      label="HuggingFace API Key"
      linkLabel="Get a key"
      placeholder="hf-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
      link="https://huggingface.co/settings/tokens"
      value={apiKey ?? ""}
      setValue={setApiKey}
      {...others}
    />
  );
}