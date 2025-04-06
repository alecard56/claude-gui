/**
 * File: src/views/AppView.tsx
 * Module: View
 * Purpose: Main application container and layout
 * Usage: Imported by main.tsx to render the application
 * Contains: AppView component, layout structure
 * Dependencies: react, mobx-react, chakra-ui
 * Iteration: 1
 */

import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Flex,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  ChakraProvider,
  theme,
  Icon,
  IconButton,
  Divider,
  useColorMode,
  useColorModeValue,
  Text,
  HStack,
  VStack,
  Tooltip
} from '@chakra-ui/react';
import { FiMenu, FiSettings, FiMoon, FiSun, FiInfo } from 'react-icons/fi';

// Import views
import PromptInputView from './PromptInputView';
import ResponseDisplayView from './ResponseDisplayView';
import ConversationHistoryView from './ConversationHistoryView';
import SettingsView from './SettingsView';

// Import controllers
import { AppController } from '../controllers/AppController';
import * as logger from '../utils/logger';

interface AppViewProps {
  controller: AppController;
  debug_mode?: boolean;
}

/**
 * Main application container with responsive layout
 */
const AppView: React.FC<AppViewProps> = observer(({ controller, debug_mode = false }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isSettingsOpen, onOpen: onOpenSettings, onClose: onCloseSettings } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const [isLoading, setIsLoading] = useState(true);
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (debug_mode) logger.debug('Initializing application');
        await controller.initialize();
        if (debug_mode) logger.debug('Application initialized successfully');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error initializing app';
        if (debug_mode) logger.error('Failed to initialize application:', errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, [controller, debug_mode]);

  if (isLoading) {
    return (
      <ChakraProvider theme={theme}>
        <Flex
          height="100vh"
          width="100vw"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          bg={bgColor}
        >
          <Text fontSize="2xl" mb={4}>Loading Claude API GUI</Text>
          {/* Could add a spinner or progress indicator here */}
        </Flex>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg={bgColor}>
        {/* Main Header */}
        <Flex
          as="header"
          position="fixed"
          top={0}
          width="100%"
          alignItems="center"
          justifyContent="space-between"
          p={3}
          bg={useColorModeValue('white', 'gray.800')}
          borderBottomWidth={1}
          borderBottomColor={borderColor}
          zIndex={10}
        >
          <HStack>
            <IconButton
              aria-label="Open sidebar"
              icon={<Icon as={FiMenu} />}
              onClick={onOpen}
              variant="ghost"
            />
            <Text fontSize="xl" fontWeight="bold">Claude API GUI</Text>
          </HStack>
          
          <HStack spacing={2}>
            <Tooltip label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton
                aria-label="Toggle color mode"
                icon={<Icon as={colorMode === 'light' ? FiMoon : FiSun} />}
                onClick={toggleColorMode}
                variant="ghost"
              />
            </Tooltip>
            <Tooltip label="Settings">
              <IconButton
                aria-label="Open settings"
                icon={<Icon as={FiSettings} />}
                onClick={onOpenSettings}
                variant="ghost"
              />
            </Tooltip>
            <Tooltip label="About">
              <IconButton
                aria-label="About"
                icon={<Icon as={FiInfo} />}
                onClick={() => controller.showAboutDialog()}
                variant="ghost"
              />
            </Tooltip>
          </HStack>
        </Flex>
        
        {/* Main Content Area */}
        <Flex 
          direction="column" 
          pt="60px" // Header height
          height="100vh"
        >
          {/* Response Display (Top Area) */}
          <Box 
            flex="1" 
            overflow="auto"
            p={4}
          >
            <ResponseDisplayView 
              controller={controller.getConversationController()} 
              debug_mode={debug_mode} 
            />
          </Box>
          
          <Divider />
          
          {/* Prompt Input (Bottom Area) */}
          <Box 
            p={4} 
            borderTopWidth={1} 
            borderTopColor={borderColor}
          >
            <PromptInputView 
              controller={controller.getConversationController()}
              debug_mode={debug_mode}
            />
          </Box>
        </Flex>
        
        {/* Sidebar (Conversations) */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Conversations</DrawerHeader>
            <DrawerBody p={0}>
              <ConversationHistoryView 
                controller={controller.getConversationController()}
                onSelectConversation={(id) => {
                  controller.getConversationController().loadConversation(id);
                  onClose();
                }}
                debug_mode={debug_mode}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        
        {/* Settings Modal */}
        <Drawer isOpen={isSettingsOpen} placement="right" onClose={onCloseSettings} size="lg">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Settings</DrawerHeader>
            <DrawerBody>
              <SettingsView 
                controller={controller.getSettingsController()}
                debug_mode={debug_mode}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
    </ChakraProvider>
  );
});

export default AppView;
