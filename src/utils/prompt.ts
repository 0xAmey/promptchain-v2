import { FluxNodeData, FluxNodeType, Settings } from "./types";
import { MAX_AUTOLABEL_CHARS } from "./constants";
import { Node } from "reactflow";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export function messagesFromLineageForHuggingFaceTextGeneration(
  lineage: Node<FluxNodeData>[]
): string {
  let str = "";

  for (let i = lineage.length - 3; i >= 0; i--) {
    const node = lineage[i];
    str += node.data.text;
  }

  return str;
}

export function messagesFromLineageForHuggingFaceConversational(
  lineage: Node<FluxNodeData>[]
): {
  past_user_inputs: string[];
  generated_responses: string[];
  text: string;
} {
  const past_user_inputs: string[] = [];
  const generated_responses: string[] = [];
  const text = lineage[lineage.length - 2].data.text;

  for (let i = lineage.length - 3; i >= 0; i--) {
    const node = lineage[i];
    if (node.data.fluxNodeType === FluxNodeType.System) {
      continue;
    } else if (node.data.fluxNodeType === FluxNodeType.User) {
      past_user_inputs.push(node.data.text);
    } else {
      generated_responses.push(node.data.text);
    }
  }

  // past_user_inputs.reverse();
  // generated_responses.reverse();

  if (past_user_inputs.length != generated_responses.length) {
    throw new Error("Mismatched past_user_inputs and generated_responses");
  }

  const messages = {
    generated_responses: generated_responses,
    past_user_inputs: past_user_inputs,
    text: text,
  };
  return messages;
}

export function messagesFromLineage(
  lineage: Node<FluxNodeData>[],
  settings: Settings,
  model?: string | undefined
): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [];
  let totLen = 0;

  // Iterate backwards.
  for (let i = lineage.length - 1; i >= 0; i--) {
    const node = lineage[i];
    totLen += node.data.text.length;
    if (node.data.fluxNodeType === FluxNodeType.System) {
      messages.push({
        role: "system",
        content: node.data.text,
      });
    } else if (i === lineage.length - 1) {
      // If this is the first node and it's
      // not a system node, we'll push the
      // default preamble on there.
      messages.push({
        role: "system",
        content: settings.defaultPreamble,
      });
    }

    if (node.data.fluxNodeType === FluxNodeType.User) {
      messages.push({
        role: "user",
        content: node.data.text,
      });
    } else if (
      node.data.fluxNodeType === FluxNodeType.TweakedModel ||
      node.data.fluxNodeType === FluxNodeType.Model
    ) {
      messages.push({
        role: "assistant",
        content: node.data.text,
      });
    }
  }

  return messages;
}

export function promptFromLineage(
  lineage: Node<FluxNodeData>[],
  settings: Settings,
  endWithNewlines: boolean = false
): string {
  const messages = messagesFromLineage(lineage, settings);

  let prompt = "";

  messages.forEach((message, i) => {
    prompt += `${message.role}: ${message.content}`;

    if (endWithNewlines ? true : i !== messages.length - 1) {
      prompt += "\n\n";
    }
  });

  return prompt;
}

export function formatAutoLabel(text: string) {
  const formattedText = removeInvalidChars(text);

  return formattedText.length > MAX_AUTOLABEL_CHARS
    ? formattedText.slice(0, MAX_AUTOLABEL_CHARS).split(" ").slice(0, -1).join(" ") +
        " ..."
    : formattedText;
}

function removeInvalidChars(text: string) {
  // The regular expression pattern:
  // ^: not
  // a-zA-Z0-9: letters and numbers
  // .,?!: common punctuation marks
  // \s: whitespace characters (space, tab, newline, etc.)
  const regex = /[^a-zA-Z0-9.,'?!-\s]+/g;

  // Replace `\n` with spaces and remove invalid characters
  const cleanedStr = text.replaceAll("\n", " ").replace(regex, "");

  return cleanedStr;
}
