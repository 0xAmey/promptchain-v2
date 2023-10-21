export const shortenModelName = (modelName: string | undefined) => {
  if (modelName === undefined) return "";
  if (modelName.includes("meta-llama/")) {
    return modelName.replace("meta-llama/", "");
  } else if (modelName.includes("anthropic/")) {
    return modelName.replace("anthropic/", "");
  } else if (modelName.includes("mistralai/")) {
    return modelName.replace("mistralai/", "");
  } else {
    return modelName;
  }
};
