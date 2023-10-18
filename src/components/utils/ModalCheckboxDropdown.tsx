import React, { useState } from "react";
import {
  Checkbox,
  Button,
  VStack,
  Modal,
  ModalOverlay,
  ModalBody,
  ModalContent,
  ModalCloseButton,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Settings } from "../../utils/types";

export default function ModalCheckboxDropdown({
  availableModels,
  selectedModels,
  setActiveModels,
  setSelectedModels,
  setSettings,
  activeModels,
  settings,
}: {
  availableModels: string[] | null;
  selectedModels: string[];
  setActiveModels: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedModels: React.Dispatch<React.SetStateAction<string[]>>;
  setSettings: (update: (prevSettings: Settings) => Settings) => void;
  activeModels: string[];
  settings: Settings;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCheckboxChange = (value: string) => {
    const newActiveModels = activeModels.filter((item) => item !== value);
    const newSelectedModels = selectedModels.includes(value)
      ? selectedModels.filter((item: string) => item !== value)
      : [...selectedModels, value];

    setActiveModels(newActiveModels);
    setSelectedModels(newSelectedModels);

    setSettings((prev) => {
      return {
        ...prev,
        activeModels: newActiveModels,
        selectedModels: newSelectedModels,
      };
    });
  };

  return (
    <>
      <Button
        onClick={toggleDropdown}
        rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      >
        Select Models
      </Button>
      <Modal isOpen={isOpen} onClose={toggleDropdown}>
        <ModalOverlay />

        <ModalContent marginTop={"10%"}>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={2} p={4}>
              {availableModels !== null &&
                availableModels.map((option) => (
                  <Checkbox
                    key={option}
                    isChecked={selectedModels.includes(option)}
                    onChange={() => handleCheckboxChange(option)}
                  >
                    {option}
                  </Checkbox>
                ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
