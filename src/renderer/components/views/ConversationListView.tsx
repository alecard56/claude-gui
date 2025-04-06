// File: src/renderer/components/views/ConversationListView.tsx
// Purpose: Component for displaying and managing conversations
// Usage: Used in MainLayout sidebar
// Contains: Conversation list, search, create new, and tag filtering
// Dependencies: React, Chakra UI, MobX
// Iteration: 1

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Icon,
  Flex,
  Divider,
  IconButton,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorMode,
  Tooltip,
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  DeleteIcon,
  EditIcon,
  StarIcon,
  ChevronDownIcon,
  SettingsIcon,
} from '@chakra-ui/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../utils/StoreContext';
import { formatDistanceToNow } from 'date-fns';

const ConversationListView: React.FC = () => {
  const { conversationStore } = useStore();
  const { colorMode } = useColorMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Filter conversations based on search and tags
  const filteredConversations = searchQuery || selectedTags.length > 0
    ? conversationStore.searchConversations(searchQuery, selectedTags.length > 0 ? selectedTags : undefined)
    : conversationStore.conversations;

  // Create a new conversation
  const handleCreateNew = () => {
    conversationStore.createConversation();
  };

  // Select a conversation
  const handleSelectConversation = (id: string) => {
    conversationStore.setActiveConversation(id);
  };

  // Toggle favorite status
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    conversationStore.toggleFavorite(id);
  };

  // Delete a conversation
  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    conversationStore.deleteConversation(id);
  };

  // Toggle tag selection
  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <Box h="100%">
      <VStack spacing={4} align="stretch" h="100%">
        {/* Search and Create New */}
        <VStack spacing={2} align="stretch">
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.500" />
            </InputLeftElement>
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius="md"
            />
          </InputGroup>
          
          <Button
            leftIcon={<AddIcon />}
            colorScheme="purple"
            size="sm"
            onClick={handleCreateNew}
            width="100%"
          >
            New Conversation
          </Button>
        </VStack>

        <Divider />

        {/* Tags Filter */}
        {conversationStore.conversationTags.length > 0 && (
          <Box>
            <Text fontSize="xs" fontWeight="bold" mb={1} color="gray.500">
              FILTER BY TAG
            </Text>
            <Flex wrap="wrap" gap={2}>
              {conversationStore.conversationTags.map((tag) => (
                <Badge
                  key={tag}
                  colorScheme={selectedTags.includes(tag) ? 'purple' : 'gray'}
                  cursor="pointer"
                  onClick={() => handleTagClick(tag)}
                  px={2}
                  py={1}
                  borderRadius="full"
                >
                  {tag}
                </Badge>
              ))}
            </Flex>
          </Box>
        )}

        {/* Conversations List */}
        <VStack 
          spacing={1} 
          align="stretch" 
          overflowY="auto" 
          flex="1"
          css={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
            },
          }}
        >
          {filteredConversations.length === 0 ? (
            <Flex 
              justify="center" 
              align="center" 
              h="100%" 
              color="gray.500"
              textAlign="center"
              px={4}
            >
              {searchQuery || selectedTags.length > 0 
                ? "No conversations match your search criteria"
                : "No conversations yet. Create a new one to get started!"}
            </Flex>
          ) : (
            // Sort conversations by updated date, newest first
            [...filteredConversations]
              .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
              .map((conversation) => (
                <Box
                  key={conversation.id}
                  p={3}
                  borderRadius="md"
                  bg={
                    conversation.id === conversationStore.activeConversationId
                      ? colorMode === 'dark'
                        ? 'purple.900'
                        : 'purple.50'
                      : colorMode === 'dark'
                      ? 'gray.800'
                      : 'white'
                  }
                  borderLeft="3px solid"
                  borderLeftColor={
                    conversation.id === conversationStore.activeConversationId
                      ? 'purple.500'
                      : 'transparent'
                  }
                  cursor="pointer"
                  onClick={() => handleSelectConversation(conversation.id)}
                  _hover={{
                    bg: colorMode === 'dark' ? 'gray.700' : 'gray.50',
                  }}
                  boxShadow="sm"
                  transition="all 0.2s"
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0} flex={1} overflow="hidden">
                      <HStack w="100%">
                        <Text 
                          fontWeight={conversation.id === conversationStore.activeConversationId ? 'bold' : 'medium'}
                          isTruncated
                          flex={1}
                        >
                          {conversation.title}
                        </Text>
                        {conversation.metadata.favorited && (
                          <StarIcon color="yellow.400" boxSize={3.5} />
                        )}
                      </HStack>
                      
                      <HStack w="100%" fontSize="xs" color="gray.500" spacing={2}>
                        <Text>
                          {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
                        </Text>
                        {conversation.metadata.model && (
                          <Text>
                            {conversation.metadata.model.split('-')[1]}
                          </Text>
                        )}
                        <Text>{conversation.messages.length} msgs</Text>
                      </HStack>
                    </VStack>
                    
                    <HStack spacing={1} opacity={0.6} _hover={{ opacity: 1 }}>
                      <Tooltip label="Favorite">
                        <IconButton
                          icon={<StarIcon />}
                          aria-label="Favorite"
                          size="xs"
                          variant="ghost"
                          colorScheme={conversation.metadata.favorited ? 'yellow' : 'gray'}
                          onClick={(e) => handleToggleFavorite(conversation.id, e)}
                        />
                      </Tooltip>
                      <Tooltip label="Delete">
                        <IconButton
                          icon={<DeleteIcon />}
                          aria-label="Delete"
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        />
                      </Tooltip>
                    </HStack>
                  </HStack>

                  {/* Tags */}
                  {conversation.tags.length > 0 && (
                    <Flex mt={2} wrap="wrap" gap={1}>
                      {conversation.tags.map((tag) => (
                        <Badge
                          key={tag}
                          colorScheme="gray"
                          fontSize="2xs"
                          variant="subtle"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </Flex>
                  )}
                </Box>
              ))
          )}
        </VStack>
      </VStack>
    </Box>
  );
};

export default observer(ConversationListView);