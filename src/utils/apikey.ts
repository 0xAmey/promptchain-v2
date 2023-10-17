export function isValidOpenAiAPIKey(apiKey: string | null) {
  return apiKey?.length == 51 && apiKey?.startsWith("sk-");
}

export function isValidHuggingFaceAPIKey(apiKey: string | null) {
  return apiKey?.length == 37 && apiKey?.startsWith("hf_");
}
