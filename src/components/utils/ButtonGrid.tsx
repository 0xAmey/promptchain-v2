import React from "react";
import { Box, Button, Flex } from "@chakra-ui/react";
import { Settings } from "../../utils/types";
import { useDebouncedEffect } from "../../utils/debounce";
import { MODEL_SETTINGS_LOCAL_STORAGE_KEY } from "../../utils/constants";
const ButtonGrid = ({
  selectedModels,
  activeModels,
  setActiveModels,
  settings,
  setSettings,
}: {
  selectedModels: string[];
  activeModels: string[];
  setActiveModels: React.Dispatch<React.SetStateAction<string[]>>;
  settings: Settings;
  setSettings: (update: (prevSettings: Settings) => Settings) => void;
}) => {
  const handleButtonClick = (value: string) => {
    const newActiveModels = activeModels.includes(value)
      ? activeModels.filter((curr) => curr !== value)
      : [...activeModels, value];

    setActiveModels(newActiveModels);

    setSettings((prev) => {
      return { ...prev, activeModels: newActiveModels };
    });
  };

  return (
    <Box
      position={"sticky"}
      top={0}
      // left="50%"
      // transform="translateX(-50%)"
      minWidth={"100%"}
      paddingTop={"20px"}
      zIndex={"sticky"}
      backgroundColor={"white"}
    >
      {chunk(selectedModels, 4).map((group, index) => (
        <Flex key={index} justifyContent="center" mb={4}>
          {group.map((text) => (
            <Button
              key={text}
              backgroundColor={activeModels.includes(text) ? "#93FAA7" : "#EDF2F7"}
              _hover={{
                backgroundColor: activeModels.includes(text) ? "#82e096" : "#dfe7ed",
              }}
              onClick={() => handleButtonClick(text)}
              mx={2}
              mb={2}
            >
              {text.includes("meta-llama") ? text.replace("meta-llama/", "") : text}
            </Button>
          ))}
        </Flex>
      ))}
    </Box>
  );
};

// Utility function to chunk an array into smaller arrays of a specific size
function chunk(array: string[], size: number): string[][] {
  const chunked: string[][] = [];
  let index = 0;

  while (index < array.length) {
    chunked.push(array.slice(index, size + index));
    index += size;
  }

  return chunked;
}

export default ButtonGrid;
