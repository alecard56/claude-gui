/**
 * File: src/views/PromptInputView.tsx
 * Module: View
 * Purpose: User interface for inputting prompts to Claude
 * Usage: Imported by AppView for the prompt input area
 * Contains: PromptInputView component, token counter, submission controls
 * Dependencies: react, mobx-react, chakra-ui
 * Iteration: 1
 */

import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  Flex,
  Textarea,
  Text,
  IconButton,
  Tooltip,
  HStack,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  VStack,
  Badge,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { FiSend, FiX, FiStopCircle, FiClipboard } from 'react-icons/fi';
import { ConversationController } from '../controllers/ConversationController';
import * as logger from '../utils/logger';

interface PromptInputViewProps {
  controller: ConversationController;
  debug_mode?: boolean;
}

/**
 * Component for entering and submitting prompts to Claude
 */
const PromptInputView: React.FC<PromptInputViewProps> = observer(({ controller, debug_mode = false }) => {
  const [promptText, setPromptText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tokenColor = useColorModeValue('gray.600', 'gray.400');
  const tokenWarningColor = useColorModeValue('orange.500', 'orange.300');
  
  // Estimated token count
  const estimatedTokens = controller.estimateTokenCount(promptText);
  const isTokenCountHigh = estimatedTokens > 4000;
  
  // Focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Enter to submit
      if (e.ctrlKey && e.key === 'Enter' && promptText.trim() !== '' && isFocused) {
        e.preventDefault();
        handleSubmit();
      }
      
      // Check for Escape to clear
      if (e.key === 'Escape' && isFocused) {
        e.preventDefault();
        setPromptText('');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [promptText, isFocused]);
  
  const handleSubmit = async () => {
    if (promptText.trim() === '') return;
    
    try {
      if (debug_mode) logger.debug('Submitting prompt:', promptText);
      
      await controller.submitPrompt(promptText);
      setPromptText('');
      
      if (debug_mode) logger.debug('Prompt submitted successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error submitting prompt';
      if (debug_mode) logger.error('Failed to submit prompt:', errorMsg);
      
      toast({
        title: 'Error submitting prompt',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleCancel = () => {
    if (debug_mode) logger.debug('Cancelling API request');
    controller.cancelRequest();
  };
  
  const handleClear = () => {
    if (debug_mode) logger.debug('Clearing prompt input');
    setPromptText('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  const handlePaste = () => {
    if (debug_mode) logger.debug('Pasting from clipboard');
    
    navigator.clipboard.readText()
      .then(text => {
        setPromptText(prevText => prevText + text);
        if (debug_mode) logger.debug('Text pasted from clipboard');
      })
      .catch(error => {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error pasting from clipboard';
        if (debug_mode) logger.error('Failed to paste from clipboard:', errorMsg);
        
        toast({
          title: 'Clipboard Error',
          description: 'Could not access clipboard. Make sure you have granted clipboard permissions.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  };
  
  return (
    <Box>
      {/* Main Textarea and Controls */}
      <Box
        position="relative"
        borderWidth={1}
        borderColor={borderColor}
        borderRadius="md"
        bg={bgColor}
      >
        <Textarea
          ref={textareaRef}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask Claude anything..."
          size="md"
          rows={4}
          resize="vertical"
          border="none"
          _focus={{ boxShadow: 'none' }}
          disabled={controller.isLoading}
        />
        
        {/* Token Counter */}
        <Flex 
          position="absolute" 
          bottom={2} 
          right={2} 
          alignItems="center"
        >
          <Tooltip label="Estimated token count">
            <Badge 
              color={isTokenCountHigh ? tokenWarningColor : tokenColor} 
              variant="outline"
              fontSize="xs"
            >
              {estimatedTokens.toLocaleString()} tokens
            </Badge>
          </Tooltip>
        </Flex>
      </Box>
      
      {/* Button Row */}
      <Flex justifyContent="space-between" mt={2}>
        <HStack>
          <Tooltip label="Paste from clipboard">
            <IconButton
              aria-label="Paste from clipboard"
              icon={<FiClipboard />}
              size="sm"
              onClick={handlePaste}
              disabled={controller.isLoading}
            />
          </Tooltip>
          
          <Tooltip label="Clear prompt (Escape)">
            <IconButton
              aria-label="Clear prompt"
              icon={<FiX />}
              size="sm"
              onClick={handleClear}
              disabled={controller.isLoading || promptText === ''}
            />
          </Tooltip>
          
          {/* Show model info in a popover */}
          <Popover trigger="hover" placement="top-start">
            <PopoverTrigger>
              <Badge colorScheme="blue" cursor="pointer">
                {controller.getCurrentModel()}
              </Badge>
            </PopoverTrigger>
            <PopoverContent width="250px">
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader>Model Settings</PopoverHeader>
              <PopoverBody>
                <VStack align="stretch" spacing={1}>
                  <Flex justifyContent="space-between">
                    <Text fontSize="sm">Temperature:</Text>
                    <Text fontSize="sm">{controller.getTemperature()}</Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text fontSize="sm">Max Tokens:</Text>
                    <Text fontSize="sm">{controller.getMaxTokens().toLocaleString()}</Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text fontSize="sm">Top P:</Text>
                    <Text fontSize="sm">{controller.getTopP()}</Text>
                  </Flex>
                  <Text fontSize="xs" mt={1} color="gray.500">
                    Change these in settings
                  </Text>
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </HStack>
        
        <HStack>
          {controller.isLoading ? (
            <Button
              colorScheme="red"
              leftIcon={<FiStopCircle />}
              onClick={handleCancel}
              size="sm"
            >
              Cancel
            </Button>
          ) : (
            <Button
              colorScheme="blue"
              leftIcon={<FiSend />}
              onClick={handleSubmit}
              size="sm"
              isDisabled={promptText.trim() === ''}
            >
              Send
            </Button>
          )}
        </HStack>
      </Flex>
      
      {/* Loading indicator */}
      {controller.isLoading && (
        <Flex justify="center" mt={4}>
          <HStack>
            <Spinner size="sm" />
            <Text fontSize="sm">Claude is thinking...</Text>
          </HStack>
        </Flex>
      )}
      
      {/* Error message if present */}
      {controller.error && (
        <Box mt={2} p={2} bg="red.100" color="red.800" borderRadius="md">
          <Text fontSize="sm">{controller.error}</Text>
        </Box>
      )}
      
      {/* Keyboard shortcut hint */}
      <Text fontSize="xs" mt={2} color="gray.500" textAlign="right">
        Press Ctrl+Enter to send
      </Text>
    </Box>
  );
});

export default PromptInputView;
