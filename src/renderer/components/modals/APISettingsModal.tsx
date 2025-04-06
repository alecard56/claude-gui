// File: src/renderer/components/modals/APISettingsModal.tsx
// Purpose: Modal for configuring API parameters
// Usage: Opened from PromptView when the settings icon is clicked
// Contains: Model selection, temperature, and other API parameter controls
// Dependencies: React, Chakra UI, MobX
// Iteration: 1

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  HStack,
  Textarea,
  Text,
  Divider,
  Box,
  useColorMode,
} from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../utils/StoreContext';

interface APISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APISettingsModal: React.FC<APISettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { apiStore, settingsStore } = useStore();
  const { colorMode } = useColorMode();
  
  const {
    model,
    temperature,
    max_tokens: maxTokens,
    top_p: topP,
  } = apiStore.currentParams;

  // Update parameters
  const handleParameterChange = (name: string, value: any) => {
    apiStore.updateParams({ [name]: value });
    
    // Also save to settings if it's one of the main parameters
    if (['model', 'temperature', 'max_tokens', 'top_p'].includes(name)) {
      settingsStore.updateNestedSetting('api', `default${name.charAt(0).toUpperCase() + name.slice(1)}` as any, value);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>API Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Model Selection */}
            <FormControl id="model">
              <FormLabel>Model</FormLabel>
              <Select
                value={model}
                onChange={(e) => handleParameterChange('model', e.target.value)}
              >
                {apiStore.availableModels.map((modelInfo) => (
                  <option key={modelInfo.name} value={modelInfo.name}>
                    {modelInfo.name} - {modelInfo.description}
                  </option>
                ))}
              </Select>
              <FormHelperText>
                Select the Claude model you want to use
              </FormHelperText>
            </FormControl>

            <Divider />

            {/* Temperature */}
            <FormControl id="temperature">
              <FormLabel>Temperature: {temperature.toFixed(2)}</FormLabel>
              <HStack spacing={4}>
                <Slider
                  value={temperature}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(val) => handleParameterChange('temperature', val)}
                  flex="1"
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <NumberInput
                  value={temperature}
                  min={0}
                  max={1}
                  step={0.01}
                  precision={2}
                  onChange={(_, val) => 
                    !isNaN(val) && handleParameterChange('temperature', val)
                  }
                  maxW="80px"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </HStack>
              <FormHelperText>
                Lower values make responses more deterministic, higher values more creative
              </FormHelperText>
            </FormControl>

            {/* Max Tokens */}
            <FormControl id="max_tokens">
              <FormLabel>Max Output Tokens: {maxTokens}</FormLabel>
              <HStack spacing={4}>
                <Slider
                  value={maxTokens}
                  min={1}
                  max={4096}
                  step={1}
                  onChange={(val) => handleParameterChange('max_tokens', val)}
                  flex="1"
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <NumberInput
                  value={maxTokens}
                  min={1}
                  max={4096}
                  step={1}
                  onChange={(_, val) => 
                    !isNaN(val) && handleParameterChange('max_tokens', val)
                  }
                  maxW="80px"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </HStack>
              <FormHelperText>
                Maximum number of tokens to generate in the response
              </FormHelperText>
            </FormControl>

            {/* Top P */}
            <FormControl id="top_p">
              <FormLabel>Top P: {topP.toFixed(2)}</FormLabel>
              <HStack spacing={4}>
                <Slider
                  value={topP}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(val) => handleParameterChange('top_p', val)}
                  flex="1"
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <NumberInput
                  value={topP}
                  min={0}
                  max={1}
                  step={0.01}
                  precision={2}
                  onChange={(_, val) => 
                    !isNaN(val) && handleParameterChange('top_p', val)
                  }
                  maxW="80px"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </HStack>
              <FormHelperText>
                Controls diversity via nucleus sampling
              </FormHelperText>
            </FormControl>

            <Divider />

            {/* System Prompt */}
            <FormControl id="system">
              <FormLabel>System Prompt</FormLabel>
              <Textarea
                value={apiStore.currentParams.system || ''}
                onChange={(e) => handleParameterChange('system', e.target.value)}
                placeholder="Instructions for Claude's behavior..."
                size="sm"
                h="120px"
              />
              <FormHelperText>
                Optional system prompt to guide Claude's behavior
              </FormHelperText>
            </FormControl>

            {/* Parameter Descriptions */}
            <Box
              p={3}
              borderRadius="md"
              bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
              fontSize="sm"
            >
              <Text fontWeight="medium" mb={2}>Parameter Guide:</Text>
              <Text mb={1}>
                <b>Temperature:</b> Controls randomness. Lower values (e.g., 0.2) for factual/consistent responses, higher values (e.g., 0.8) for creative responses.
              </Text>
              <Text mb={1}>
                <b>Max Tokens:</b> Controls the maximum length of Claude's response.
              </Text>
              <Text mb={1}>
                <b>Top P:</b> Controls the diversity of responses. Lower values make responses more focused.
              </Text>
              <Text>
                <b>System Prompt:</b> Sets overall instructions and context for Claude's behavior.
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="purple" onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default observer(APISettingsModal);