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

export default function ModalCheckboxDropdown({
  availableModels,
  selectedModels,
  setSelectedModels,
}: {
  availableModels: string[];
  selectedModels: string[];
  setSelectedModels: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCheckboxChange = (value: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item: string) => item !== value);
      } else {
        return [...prev, value];
      }
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
              {availableModels.map((option) => (
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
