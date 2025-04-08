/**
 * File: src/renderer/components/modals/AuthModal.tsx
 * 
 * Module: View
 * Purpose: Modal for API key authentication
 * Usage: Displayed when user needs to authenticate
 * Contains: API key input form, validation, and profile creation
 * Dependencies: React, Chakra UI, MobX
 * Iteration: 2
 */

import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  Alert,
  AlertIcon,
  Text,
  useToast,
  IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../utils/StoreContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  closeOnOverlayClick = true
}) => {
  const { authStore } = useStore();
  const [apiKey, setApiKey] = useState('');
  const [profileName, setProfileName] = useState('Default');
  const [showApiKey, setShowApiKey] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an API key',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // First validate the key with the API
      const isValid = await authStore.validateAPIKey(apiKey);
      
      if (isValid) {
        // If valid, store it
        const success = await authStore.storeAPIKey(apiKey, profileName);
        
        if (success) {
          toast({
            title: 'Success',
            description: 'API key validated and stored successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          onClose();
        } else {
          toast({
            title: 'Error',
            description: authStore.error || 'Failed to store API key',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      } else {
        toast({
          title: 'Invalid API Key',
          description: authStore.error || 'The API key is invalid or could not be verified',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      closeOnOverlayClick={closeOnOverlayClick}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Claude API Authentication</ModalHeader>
          {closeOnOverlayClick && <ModalCloseButton />}
          
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  To use this application, you need a Claude API key. You can get one from
                  your Anthropic account dashboard.
                </Text>
              </Alert>

              <FormControl id="profile-name" isRequired>
                <FormLabel>Profile Name</FormLabel>
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Default"
                  aria-label="Profile Name"
                />
                <FormHelperText>
                  A name for this API key profile
                </FormHelperText>
              </FormControl>

              <FormControl id="api-key" isRequired>
                <FormLabel>Claude API Key</FormLabel>
                <InputGroup>
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    aria-label="Claude API Key"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showApiKey ? 'Hide API Key' : 'Show API Key'}
                      icon={showApiKey ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowApiKey(!showApiKey)}
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
                <FormHelperText>
                  Your API key is stored securely on your device only
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="purple" 
              mr={3} 
              type="submit"
              isLoading={authStore.isAuthenticating}
            >
              Authenticate
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default observer(AuthModal);