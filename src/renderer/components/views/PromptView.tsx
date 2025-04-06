// File: src/renderer/components/views/PromptView.tsx
// Purpose: Component for creating and submitting prompts to Claude API
// Usage: Used in MainLayout as the prompt input area
// Contains: Text editor, token counter, and submit button
// Dependencies: React, Chakra UI, MobX
// Iteration: 1

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Textarea,
  Text,
  IconButton,
  HStack,
  Tooltip,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { 
  ArrowUpIcon, 
  DeleteIcon, 
  InfoIcon,
  SettingsIcon,
} from '@chakra-ui/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../utils/StoreContext';

interface PromptViewProps {
  onSettingsClick?: () => void;
}

const PromptView: React.FC<PromptViewProps> = ({ 
  onSettingsClick
}) => {
  const { apiStore, conversationStore, authStore } = useStore();
  const [prompt, setPrompt] = useState('');
  const [tokenCount, setTokenCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { colorMode } = useColorMode();
  const toast = useToast();

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Estimate token count (simple approximation)
  useEffect(() => {
    // Simple estimation: ~4 chars per token on average
    setTokenCount(Math.ceil(prompt.length / 4));
  }, [prompt]);

  // Handle prompt submission
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Empty prompt',
        description: 'Please enter a prompt before submitting',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!authStore.isAuthenticated) {
      toast({
        title: 'Not authenticated',
        description: 'Please add your API key first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Get or create active conversation
      let activeConversation = conversationStore.getActiveConversation();
      if (!activeConversation) {
        activeConversation = conversationStore.createConversation();
      }

      // Add user message to conversation
      await conversationStore.addMessage(prompt, 'user', {
        tokens: tokenCount,
      });

      // Send to API
      const response = await apiStore.sendPrompt(prompt);

      if (response) {
        // Add assistant response to conversation
        await conversationStore.addMessage(
          response.content,
          'assistant',
          {
            tokens: response.usage.outputTokens,
            model: response.model,
          }
        );

        // Clear prompt after successful submission
        setPrompt('');
      } else if (apiStore.error) {
        toast({
          title: 'API Error',
          description: apiStore.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Clear prompt text
  const handleClear = () => {
    setPrompt('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <Box w="100%" h="100%">
      <Flex 
        direction="column" 
        h="100%" 
        p={4}
        bg={colorMode === 'dark' ? 'gray.800' : 'white'}
        borderRadius="md"
        boxShadow="sm"
      >
        {/* Prompt Textarea */}
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message to Claude..."
          size="md"
          resize="none"
          border="none"
          _focus={{ border: 'none', boxShadow: 'none' }}
          flex="1"
          minH={20}
          maxH="100%"
          fontSize="md"
          bg={colorMode === 'dark' ? 'gray.800' : 'white'}
          color={colorMode === 'dark' ? 'white' : 'gray.800'}
        />

        {/* Controls */}
        <Flex justifyContent="space-between" alignItems="center" mt={2} pt={2} borderTop="1px solid" borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.100'}>
          {/* Left side controls */}
          <HStack spacing={1}>
            <Tooltip label="API Settings">
              <IconButton
                aria-label="API Settings"
                icon={<SettingsIcon />}
                size="sm"
                variant="ghost"
                onClick={onSettingsClick}
              />
            </Tooltip>

            <Tooltip label={`Estimated tokens: ${tokenCount}`}>
              <Flex alignItems="center" px={2}>
                <InfoIcon mr={1} boxSize={3} />
                <Text fontSize="xs" color={tokenCount > 8000 ? 'red.500' : undefined}>
                  {tokenCount} tokens
                </Text>
              </Flex>
            </Tooltip>
          </HStack>

          {/* Right side controls */}
          <HStack spacing={2}>
            <Tooltip label="Clear prompt (Ctrl+L)">
              <IconButton
                aria-label="Clear"
                icon={<DeleteIcon />}
                size="sm"
                variant="ghost"
                onClick={handleClear}
              />
            </Tooltip>

            <Button
              rightIcon={<ArrowUpIcon />}
              colorScheme="purple"
              size="sm"
              onClick={handleSubmit}
              isLoading={apiStore.isLoading}
              loadingText="Sending"
            >
              Send
            </Button>
          </HStack>
        </Flex>
      </Flex>
    </Box>
  );
};

export default observer(PromptView);