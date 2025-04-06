/**
 * File: src/views/ConversationHistoryView.tsx
 * Module: View
 * Purpose: Displays conversation history and allows selection
 * Usage: Imported by AppView for the sidebar
 * Contains: ConversationHistoryView component, search and filtering
 * Dependencies: react, mobx-react, chakra-ui
 * Iteration: 1
 */

import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Divider,
  List,
  ListItem,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Tooltip,
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Flex,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiStar, FiMoreVertical, FiEdit, FiTrash, FiTag, FiFilter } from 'react-icons/fi';
import { ConversationController } from '../controllers/ConversationController';
import { Conversation } from '../models/ConversationModel';
import * as logger from '../utils/logger';

interface ConversationHistoryViewProps {
  controller: ConversationController;
  onSelectConversation: (id: string) => void;
  debug_mode?: boolean;
}

/**
 * Component for displaying and managing conversation history
 */
const ConversationHistoryView: React.FC<ConversationHistoryViewProps> = observer(({ 
  controller, 
  onSelectConversation,
  debug_mode = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  const activeBgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Get conversations and apply filtering
  const allConversations = controller.getAllConversations();
  const tags = controller.getAllTags();
  
  // Filter conversations based on search and tags
  const filteredConversations = allConversations.filter(conv => {
    // Apply search filter
    const matchesSearch = searchQuery === '' || 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply tag filter
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => conv.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });
  
  // Get active conversation
  const activeConversationId = controller.getActiveConversationId();
  
  useEffect(() => {
    if (debug_mode) {
      logger.debug(`ConversationHistoryView: ${allConversations.length} total conversations, ${filteredConversations.length} after filtering`);
    }
  }, [allConversations.length, filteredConversations.length, debug_mode]);
  
  const handleCreateNewConversation = () => {
    if (debug_mode) logger.debug('Creating new conversation');
    controller.startNewConversation();
  };
  
  const handleDeleteConversation = (id: string) => {
    if (debug_mode) logger.debug(`Opening delete confirmation for conversation: ${id}`);
    setConversationToDelete(id);
    onOpen();
  };
  
  const confirmDelete = () => {
    if (!conversationToDelete) return;
    
    if (debug_mode) logger.debug(`Deleting conversation: ${conversationToDelete}`);
    controller.deleteConversation(conversationToDelete);
    onClose();
    setConversationToDelete(null);
  };
  
  const handleToggleFavorite = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (debug_mode) logger.debug(`Toggling favorite status for conversation: ${id}`);
    controller.toggleFavorite(id);
  };
  
  const handleRenameConversation = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const conversation = allConversations.find(c => c.id === id);
    if (!conversation) return;
    
    const newTitle = window.prompt('Enter new title', conversation.title);
    if (newTitle !== null && newTitle.trim() !== '') {
      if (debug_mode) logger.debug(`Renaming conversation ${id} to: ${newTitle}`);
      controller.renameConversation(id, newTitle);
    }
  };
  
  const handleManageTags = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const conversation = allConversations.find(c => c.id === id);
    if (!conversation) return;
    
    // This is a simple implementation. In a real app, you'd use a proper tag selection UI
    const tagsInput = window.prompt('Enter tags (comma-separated)', conversation.tags.join(', '));
    
    if (tagsInput !== null) {
      const newTags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
      
      if (debug_mode) logger.debug(`Setting tags for conversation ${id}: ${newTags.join(', ')}`);
      controller.tagConversation(id, newTags);
    }
  };
  
  const handleTagSelection = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Remove tag if already selected
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      // Add tag to selection
      setSelectedTags([...selectedTags, tag]);
    }
    
    if (debug_mode) {
      logger.debug(`Tag selection changed: ${[...selectedTags, tag].join(', ')}`);
    }
  };
  
  const clearTagFilters = () => {
    if (debug_mode) logger.debug('Clearing all tag filters');
    setSelectedTags([]);
  };
  
  // Function to format date as relative time (today, yesterday, or date)
  const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const conversationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (conversationDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (conversationDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Render conversation item
  const renderConversationItem = (conversation: Conversation) => {
    const isActive = conversation.id === activeConversationId;
    const date = new Date(conversation.updatedAt);
    const formattedDate = formatRelativeDate(date);
    
    // Get preview from the first user message (or first message if no user messages)
    const previewMessage = conversation.messages.find(m => m.role === 'user') || conversation.messages[0];
    const preview = previewMessage 
      ? previewMessage.content.substring(0, 60) + (previewMessage.content.length > 60 ? '...' : '')
      : 'No messages';
    
    return (
      <ListItem
        key={conversation.id}
        p={3}
        borderRadius="md"
        cursor="pointer"
        bg={isActive ? activeBgColor : bgColor}
        _hover={{ bg: isActive ? activeBgColor : hoverBgColor }}
        onClick={() => onSelectConversation(conversation.id)}
        borderWidth={1}
        borderColor={borderColor}
        mb={2}
      >
        <VStack align="stretch" spacing={1}>
          <HStack justifyContent="space-between">
            <HStack>
              <Text fontWeight="bold" noOfLines={1} maxWidth="180px">
                {conversation.title}
              </Text>
              {conversation.metadata.favorited && (
                <FiStar size={16} color="gold" />
              )}
            </HStack>
            
            <Menu placement="bottom-end" isLazy>
              <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                variant="ghost"
                size="xs"
                aria-label="Options"
                onClick={(e) => e.stopPropagation()}
              />
              <MenuList>
                <MenuItem 
                  icon={<FiStar />} 
                  onClick={(e) => handleToggleFavorite(conversation.id, e)}
                >
                  {conversation.metadata.favorited ? 'Remove from Favorites' : 'Add to Favorites'}
                </MenuItem>
                <MenuItem 
                  icon={<FiEdit />} 
                  onClick={(e) => handleRenameConversation(conversation.id, e)}
                >
                  Rename
                </MenuItem>
                <MenuItem 
                  icon={<FiTag />} 
                  onClick={(e) => handleManageTags(conversation.id, e)}
                >
                  Manage Tags
                </MenuItem>
                <MenuItem 
                  icon={<FiTrash />} 
                  onClick={(e) => handleDeleteConversation(conversation.id)}
                  color="red.500"
                >
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
          
          <Text fontSize="xs" color="gray.500" noOfLines={1}>
            {preview}
          </Text>
          
          <HStack justifyContent="space-between" mt={1}>
            <Text fontSize="xs" color="gray.500">
              {formattedDate}
            </Text>
            
            <Text fontSize="xs" color="gray.500">
              {conversation.messages.length} messages
            </Text>
          </HStack>
          
          {conversation.tags.length > 0 && (
            <Wrap mt={1} spacing={1}>
              {conversation.tags.map(tag => (
                <WrapItem key={tag}>
                  <Tag size="sm" variant="subtle" colorScheme="blue">
                    <TagLabel>{tag}</TagLabel>
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          )}
        </VStack>
      </ListItem>
    );
  };
  
  return (
    <Box height="100%">
      {/* Search and Actions */}
      <Box p={4} borderBottomWidth={1} borderBottomColor={borderColor}>
        <InputGroup mb={4}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          width="100%"
          onClick={handleCreateNewConversation}
        >
          New Conversation
        </Button>
      </Box>
      
      {/* Tag Filters */}
      {tags.length > 0 && (
        <Box p={4} borderBottomWidth={1} borderBottomColor={borderColor}>
          <Flex justifyContent="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="bold">
              Filter by Tags
            </Text>
            {selectedTags.length > 0 && (
              <Button size="xs" variant="link" onClick={clearTagFilters}>
                Clear
              </Button>
            )}
          </Flex>
          
          <Wrap spacing={2}>
            {tags.map(tag => (
              <WrapItem key={tag}>
                <Tag 
                  size="sm" 
                  variant={selectedTags.includes(tag) ? "solid" : "subtle"} 
                  colorScheme="blue"
                  cursor="pointer"
                  onClick={() => handleTagSelection(tag)}
                >
                  <TagLabel>{tag}</TagLabel>
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}
      
      {/* Conversation List */}
      <Box 
        p={4} 
        overflowY="auto"
        height="calc(100% - 180px)"
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)'),
            borderRadius: '24px',
          },
        }}
      >
        {filteredConversations.length === 0 ? (
          <Box textAlign="center" mt={8} color="gray.500">
            {searchQuery || selectedTags.length > 0 ? (
              <Text>No conversations match your filters</Text>
            ) : (
              <Text>No conversations yet</Text>
            )}
          </Box>
        ) : (
          <List spacing={1}>
            {filteredConversations.map(renderConversationItem)}
          </List>
        )}
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Conversation
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
});

export default ConversationHistoryView;
