// File: src/renderer/components/layouts/MainLayout.tsx
// Purpose: Main application layout component
// Usage: Used in App.tsx as the main layout container
// Contains: Sidebar and content area structure
// Dependencies: React, Chakra UI
// Iteration: 1

import React from 'react';
import {
  Box,
  Flex,
  useColorMode,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
  Heading,
} from '@chakra-ui/react';
import { HamburgerIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../utils/StoreContext';

// Placeholder components - replace with actual components when available
const ConversationListView = () => <Box p={4}>Conversation List Placeholder</Box>;
const PromptView = () => <Box p={4}>Prompt View Placeholder</Box>;
const ResponseView = () => <Box p={4}>Response View Placeholder</Box>;

const MainLayout: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { authStore } = useStore();

  return (
    <Flex h="100vh" direction="column">
      {/* Top Navigation Bar */}
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding={4}
        bg={colorMode === 'dark' ? 'gray.800' : 'white'}
        color={colorMode === 'dark' ? 'white' : 'black'}
        boxShadow="sm"
      >
        <Flex align="center">
          <IconButton
            aria-label="Open Menu"
            icon={<HamburgerIcon />}
            onClick={onOpen}
            display={{ base: 'flex', md: 'none' }}
            mr={2}
          />
          <Heading size="md">Claude API GUI</Heading>
        </Flex>

        <Flex>
          <IconButton
            aria-label="Toggle Color Mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
          />
        </Flex>
      </Flex>

      {/* Main Content Area */}
      <Flex flex={1} overflow="hidden">
        {/* Sidebar - Desktop */}
        <Box
          w={{ base: 0, md: '300px' }}
          h="100%"
          bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
          display={{ base: 'none', md: 'block' }}
          overflowY="auto"
        >
          <ConversationListView />
        </Box>

        {/* Sidebar - Mobile */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Conversations</DrawerHeader>
            <DrawerBody>
              <ConversationListView />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Content Area */}
        <Flex
          flex={1}
          direction="column"
          h="100%"
          overflow="hidden"
          bg={colorMode === 'dark' ? 'gray.900' : 'white'}
        >
          {/* Prompt Area */}
          <Box h="40%" overflowY="auto" p={4} borderBottom="1px solid" borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}>
            <PromptView />
          </Box>

          {/* Response Area */}
          <Box flex={1} overflowY="auto" p={4}>
            <ResponseView />
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default observer(MainLayout);