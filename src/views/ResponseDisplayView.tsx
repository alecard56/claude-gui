/**
 * File: src/views/ResponseDisplayView.tsx
 * Module: View
 * Purpose: Renders Claude responses with markdown formatting
 * Usage: Imported by AppView for displaying conversation
 * Contains: ResponseDisplayView component, message rendering logic
 * Dependencies: react, mobx-react, chakra-ui, react-markdown, prism.js
 * Iteration: 1
 */

import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  VStack,
  HStack,
  Text,
  Flex,
  Divider,
  IconButton,
  Tooltip,
  useColorModeValue,
  Badge,
  Avatar,
  useToast
} from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiCopy, FiUser, FiCornerDownRight } from 'react-icons/fi';
import { ConversationController } from '../controllers/ConversationController';
import { Message } from '../models/ConversationModel';
import * as logger from '../utils/logger';

interface ResponseDisplayViewProps {
  controller: ConversationController;
  debug_mode?: boolean;
}

interface MessageProps {
  message: Message;
  onCopy: (content: string) => void;
  debug_mode?: boolean;
}

/**
 * Component for displaying a single message in the conversation
 */
const MessageComponent: React.FC<MessageProps> = ({ message, onCopy, debug_mode = false }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  const userBgColor = useColorModeValue('blue.50', 'blue.900');
  const assistantBgColor = useColorModeValue('gray.50', 'gray.800');
  const systemBgColor = useColorModeValue('purple.50', 'purple.900');
  
  const bgColor = isUser ? userBgColor : isSystem ? systemBgColor : assistantBgColor;
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Format the created time
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Custom renderers for markdown
  const renderers = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    // Add custom renderers for other markdown elements if needed
  };
  
  if (debug_mode) {
    logger.debug(`Rendering ${message.role} message: ${message.id}`);
  }
  
  return (
    <Box
      p={4}
      borderRadius="md"
      bg={bgColor}
      borderWidth={1}
      borderColor={borderColor}
      width="100%"
      position="relative"
    >
      <HStack spacing={2} mb={2}>
        <Avatar 
          size="xs" 
          name={isUser ? 'User' : isSystem ? 'System' : 'Claude'} 
          src={isUser ? undefined : isSystem ? undefined : '/claude-avatar.png'} 
          bg={isUser ? 'blue.500' : isSystem ? 'purple.500' : 'gray.500'}
          icon={isUser ? <FiUser /> : isSystem ? <FiCornerDownRight /> : undefined}
        />
        <Text fontWeight="bold">
          {isUser ? 'You' : isSystem ? 'System' : 'Claude'}
        </Text>
        <Badge size="sm" variant="outline">
          {formattedTime}
        </Badge>
        {message.metadata.tokens > 0 && (
          <Badge size="sm" colorScheme="green">
            {message.metadata.tokens} tokens
          </Badge>
        )}
      </HStack>
      
      <Box className="message-content" fontSize="md">
        {isUser ? (
          <Text whiteSpace="pre-wrap">{message.content}</Text>
        ) : (
          <ReactMarkdown components={renderers}>
            {message.content}
          </ReactMarkdown>
        )}
      </Box>
      
      <Box position="absolute" top={2} right={2}>
        <Tooltip label="Copy to clipboard">
          <IconButton
            aria-label="Copy message"
            icon={<FiCopy />}
            size="xs"
            variant="ghost"
            onClick={() => onCopy(message.content)}
          />
        </Tooltip>
      </Box>
    </Box>
  );
};

/**
 * Component for displaying the entire conversation
 */
const ResponseDisplayView: React.FC<ResponseDisplayViewProps> = observer(({ controller, debug_mode = false }) => {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [controller.getActiveConversation()?.messages]);
  
  const handleCopy = (content: string) => {
    if (debug_mode) logger.debug('Copying message content to clipboard');
    
    navigator.clipboard.writeText(content)
      .then(() => {
        toast({
          title: 'Copied to clipboard',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        
        if (debug_mode) logger.debug('Content copied successfully');
      })
      .catch(error => {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error copying to clipboard';
        if (debug_mode) logger.error('Failed to copy to clipboard:', errorMsg);
        
        toast({
          title: 'Copy failed',
          description: 'Could not copy to clipboard',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  };
  
  const activeConversation = controller.getActiveConversation();
  const messages = activeConversation?.messages || [];
  
  if (debug_mode) {
    logger.debug(`Rendering conversation with ${messages.length} messages`);
  }
  
  return (
    <Box 
      height="100%" 
      overflow="auto" 
      p={4} 
      bg={bgColor}
      borderRadius="md"
    >
      {messages.length === 0 ? (
        <Flex 
          height="100%" 
          alignItems="center" 
          justifyContent="center" 
          flexDirection="column"
        >
          <Text fontSize="xl" mb={4}>No conversation yet</Text>
          <Text color="gray.500">Start by typing a message to Claude below</Text>
        </Flex>
      ) : (
        <VStack spacing={4} align="stretch">
          {messages.map((message) => (
            <MessageComponent 
              key={message.id} 
              message={message} 
              onCopy={handleCopy}
              debug_mode={debug_mode}
            />
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      )}
    </Box>
  );
});

export default ResponseDisplayView;
