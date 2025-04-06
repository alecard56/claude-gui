// File: src/renderer/components/views/ResponseView.tsx
// Purpose: Component for displaying Claude API responses
// Usage: Used in MainLayout as the response display area
// Contains: Markdown renderer, response controls, and conversation history
// Dependencies: React, Chakra UI, MobX, React Markdown
// Iteration: 1

import React from 'react';
import {
  Box,
  Text,
  VStack,
  Flex,
  Divider,
  IconButton,
  HStack,
  Badge,
  useColorMode,
  Tooltip,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { CopyIcon, DownloadIcon } from '@chakra-ui/icons';
import { observer } from 'mobx-react-lite';
import ReactMarkdown from 'react-markdown';
import { useStore } from '../../../utils/StoreContext';
import { Message } from '../../../models/ConversationModel';

const ResponseView: React.FC = () => {
  const { conversationStore, apiStore } = useStore();
  const { colorMode } = useColorMode();
  const activeConversation = conversationStore.getActiveConversation();

  // Handle message copying
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Render a single message
  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const messageColor = isUser 
      ? colorMode === 'dark' ? 'gray.300' : 'gray.700'
      : colorMode === 'dark' ? 'white' : 'black';
    
    return (
      <Box
        key={message.id}
        w="100%"
        mb={4}
        p={4}
        borderRadius="md"
        bg={isUser 
          ? (colorMode === 'dark' ? 'gray.700' : 'gray.100') 
          : (colorMode === 'dark' ? 'gray.800' : 'white')
        }
        borderLeft="4px solid"
        borderLeftColor={isUser ? 'gray.500' : 'purple.500'}
      >
        <Flex justify="space-between" align="center" mb={2}>
          <HStack>
            <Badge colorScheme={isUser ? 'gray' : 'purple'}>
              {isUser ? 'You' : 'Claude'}
            </Badge>
            {message.metadata.model && (
              <Badge colorScheme="blue" variant="outline" fontSize="xs">
                {message.metadata.model.split('-')[1]}
              </Badge>
            )}
          </HStack>
          
          <HStack spacing={1}>
            <Tooltip label="Copy message">
              <IconButton
                aria-label="Copy"
                icon={<CopyIcon />}
                size="xs"
                variant="ghost"
                onClick={() => handleCopy(message.content)}
              />
            </Tooltip>
          </HStack>
        </Flex>
        
        <Box
          color={messageColor}
          className="markdown-content"
          sx={{
            // Custom styling for markdown content
            'p': { mt: 2, mb: 2 },
            'h1, h2, h3, h4, h5, h6': { 
              mt: 4, 
              mb: 2, 
              fontWeight: 'bold' 
            },
            'h1': { fontSize: 'xl' },
            'h2': { fontSize: 'lg' },
            'h3': { fontSize: 'md' },
            'ul, ol': { pl: 6, mt: 2, mb: 2 },
            'li': { mb: 1 },
            'pre': {
              bg: colorMode === 'dark' ? 'gray.700' : 'gray.100',
              p: 2,
              borderRadius: 'md',
              overflowX: 'auto',
              mt: 2,
              mb: 2,
            },
            'code': {
              bg: colorMode === 'dark' ? 'gray.700' : 'gray.100',
              px: 1,
              borderRadius: 'sm',
              fontFamily: 'monospace',
            },
            'pre code': {
              bg: 'transparent',
              p: 0,
              borderRadius: 0,
            },
            'blockquote': {
              borderLeft: '4px solid',
              borderLeftColor: colorMode === 'dark' ? 'gray.600' : 'gray.300',
              pl: 3,
              pr: 2,
              py: 1,
              my: 2,
              fontStyle: 'italic',
              color: colorMode === 'dark' ? 'gray.400' : 'gray.600',
            },
            'a': {
              color: 'blue.500',
              textDecoration: 'underline',
            },
            'table': {
              width: '100%',
              my: 3,
              borderCollapse: 'collapse',
            },
            'th, td': {
              border: '1px solid',
              borderColor: colorMode === 'dark' ? 'gray.600' : 'gray.300',
              px: 2,
              py: 1,
            },
            'th': {
              bg: colorMode === 'dark' ? 'gray.700' : 'gray.100',
              fontWeight: 'bold',
            }
          }}
        >
          {isUser ? (
            <Text>{message.content}</Text>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </Box>
      </Box>
    );
  };

  // Loading state
  if (apiStore.isLoading) {
    return (
      <Center h="100%">
        <VStack spacing={4}>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
            color="purple.500"
            size="xl"
          />
          <Text>Claude is thinking...</Text>
        </VStack>
      </Center>
    );
  }

  // Empty state
  if (!activeConversation || activeConversation.messages.length === 0) {
    return (
      <Center h="100%" p={8}>
        <VStack spacing={3} maxW="600px" textAlign="center">
          <Text fontSize="lg" fontWeight="bold">
            Start a conversation with Claude
          </Text>
          <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            Type a message in the input area below to start a new conversation. 
            Claude can assist with writing, answering questions, providing information, 
            and much more.
          </Text>
          <Divider my={4} />
          <VStack align="stretch" spacing={2} w="full" opacity={0.8}>
            <Text fontSize="sm" fontWeight="medium">Example prompts:</Text>
            <Box 
              p={2} 
              bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'} 
              borderRadius="md"
              fontSize="sm"
            >
              Can you help me draft an email to request a deadline extension for my project?
            </Box>
            <Box 
              p={2} 
              bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'} 
              borderRadius="md"
              fontSize="sm"
            >
              Explain the concept of quantum computing like I'm 10 years old.
            </Box>
            <Box 
              p={2} 
              bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'} 
              borderRadius="md"
              fontSize="sm"
            >
              Write a poem about the changing seasons in the style of Robert Frost.
            </Box>
          </VStack>
        </VStack>
      </Center>
    );
  }

  // Conversation view
  return (
    <Box 
      h="100%" 
      overflowY="auto"
      p={4}
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: colorMode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
        },
      }}
    >
      <VStack spacing={4} align="stretch">
        {activeConversation.messages.map(renderMessage)}
      </VStack>
    </Box>
  );
};

export default observer(ResponseView);