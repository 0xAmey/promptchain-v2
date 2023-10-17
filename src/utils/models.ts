export function getAvailableOpenAiModels(apiKey: string): Promise<string[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      const data = await response.json();
      resolve(data.data.map((model: any) => model.id).sort());
    } catch (err) {
      reject(err);
    }
  });
}

export function getAvailableOpenAiChatModels(apiKey: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    getAvailableOpenAiModels(apiKey)
      .then((models) => {
        resolve(models.filter((model) => model.startsWith("gpt-")));
      })
      .catch((err) => {
        reject(err);
      });
  });
}
