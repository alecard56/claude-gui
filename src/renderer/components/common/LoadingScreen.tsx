// File: src/renderer/components/common/LoadingScreen.tsx
// Purpose: Loading screen displayed during application initialization
// Usage: Used in App.tsx when checking auth or loading initial data
// Contains: Spinner and branding elements
// Dependencies: React, Chakra UI
// Iteration: 1

import React from 'react';
import {
  Box,
  Center,
  Spinner,
  Text,
  VStack,
  useColorMode,
} from '@chakra-ui/react';

const LoadingScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  
  return (
    <Box
      width="100vw"
      height="100vh"
      bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}
      color={colorMode === 'dark' ? 'white' : 'gray.800'}
    >
      <Center height="100%">
        <VStack spacing={6}>
          <Text
            fontSize="3xl"
            fontWeight="bold"
            bgGradient={
              colorMode === 'dark'
                ? 'linear(to-l, #a480ff, #7a4dff)'
                : 'linear(to-l, #4300e5, #7a4dff)'
            }
            bgClip="text"
          >
            Claude API GUI
          </Text>
          
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
            color={colorMode === 'dark' ? 'purple.300' : 'purple.500'}
            size="xl"
          />
          
          <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            Initializing application...
          </Text>
        </VStack>
      </Center>
    </Box>
  );
};

export default LoadingScreen;