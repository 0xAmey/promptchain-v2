import React from "react";
import { Box, Button, Flex } from "@chakra-ui/react";

const ButtonGrid = ({
  selectedModels,
  activeModels,
  setActiveModels,
}: {
  selectedModels: string[];
  activeModels: string[];
  setActiveModels: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const handleButtonClick = (value: string) => {
    if (activeModels.includes(value)) {
      setActiveModels((prev) => prev.filter((curr) => curr !== value));
    } else {
      setActiveModels((prev) => [...prev, value]);
    }
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
