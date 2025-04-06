// File: src/renderer/App.tsx
// Purpose: Main application component
// Usage: Imported by main.tsx, provides the application shell
// Contains: Layout components, routing, and global state usage
// Dependencies: React, Chakra UI, MobX
// Iteration: 1

import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  useColorMode,
  useDisclosure,
} from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../utils/StoreContext';
import MainLayout from './components/layouts/MainLayout';
import AuthModal from './components/modals/AuthModal';
import LoadingScreen from './components/common/LoadingScreen';

const App: React.FC = () => {
  const { authStore } = useStore();
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on startup
  useEffect(() => {
    const checkAuth = async () => {
      await authStore.checkAuthentication();
      setIsLoading(false);
      
      if (!authStore.isAuthenticated) {
        onOpen();
      }
    };
    
    checkAuth();
  }, [authStore, onOpen]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box 
      bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'} 
      color={colorMode === 'dark' ? 'white' : 'gray.800'}
      minH="100vh"
    >
      <MainLayout />
      
      <AuthModal 
        isOpen={isOpen} 
        onClose={onClose}
        // Only allow closing if authenticated
        closeOnOverlayClick={authStore.isAuthenticated}
      />
    </Box>
  );
};

export default observer(App);