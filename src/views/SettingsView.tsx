/**
 * File: src/views/SettingsView.tsx
 * Module: View
 * Purpose: User interface for application settings
 * Usage: Imported by AppView for the settings panel
 * Contains: SettingsView component, form controls for settings
 * Dependencies: react, mobx-react, chakra-ui
 * Iteration: 1
 */

import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Select,
  Switch,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Textarea,
  Button,
  Text,
  Divider,
  useColorModeValue,
  Badge,
  Flex,
  Tooltip,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { SettingsController } from '../controllers/SettingsController';
import * as logger from '../utils/logger';

interface SettingsViewProps {
  controller: SettingsController;
  debug_mode?: boolean;
}

/**
 * Component for displaying and modifying application settings
 */
const SettingsView: React.FC<SettingsViewProps> = observer(({ controller, debug_mode = false }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();
  
  const settings = controller.getSettings();
  const apiConfig = settings.api;
  const themeConfig = settings.theme;
  const editorConfig = settings.editor;
  const interfaceConfig = settings.interface;
  const storageConfig = settings.storage;
  
  const availableModels = controller.getAvailableModels();
  
  const handleResetSettings = () => {
    if (debug_mode) logger.debug('Resetting settings to defaults');
    controller.resetSettings();
    
    toast({
      title: 'Settings Reset',
      description: 'All settings have been reset to their default values',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    
    onClose();
  };
  
  const handleExportSettings = () => {
    if (debug_mode) logger.debug('Exporting settings');
    
    try {
      const settingsJson = controller.exportSettings();
      
      // Create and download a JSON file
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'claude-api-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      if (debug_mode) logger.debug('Settings exported successfully');
      
      toast({
        title: 'Settings Exported',
        description: 'Settings exported to JSON file',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error exporting settings';
      if (debug_mode) logger.error('Failed to export settings:', errorMsg);
      
      toast({
        title: 'Export Failed',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    if (debug_mode) logger.debug('Importing settings from file');
    
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const settingsJson = e.target?.result as string;
        const success = controller.importSettings(settingsJson);
        
        if (success) {
          if (debug_mode) logger.debug('Settings imported successfully');
          
          toast({
            title: 'Settings Imported',
            description: 'Settings imported successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } else {
          throw new Error('Failed to import settings');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error importing settings';
        if (debug_mode) logger.error('Failed to import settings:', errorMsg);
        
        toast({
          title: 'Import Failed',
          description: errorMsg,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    
    reader.readAsText(file);
  };
  
  return (
    <Box>
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>API</Tab>
          <Tab>Appearance</Tab>
          <Tab>Editor</Tab>
          <Tab>Interface</Tab>
          <Tab>Storage</Tab>
          <Tab>Advanced</Tab>
        </TabList>
        
        <TabPanels>
          {/* API Settings Panel */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Default Model</FormLabel>
                <Select
                  value={apiConfig.defaultModel}
                  onChange={(e) => controller.updateAPIConfig('defaultModel', e.target.value)}
                >
                  {availableModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name || model.id}
                    </option>
                  ))}
                </Select>
                <FormHelperText>
                  Select the Claude model to use by default
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Temperature: {apiConfig.temperature}</FormLabel>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={apiConfig.temperature}
                  onChange={(value) => controller.updateAPIConfig('temperature', value)}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <FormHelperText>
                  Lower values make responses more focused and deterministic. Higher values make responses more creative.
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Max Tokens</FormLabel>
                <NumberInput
                  min={1}
                  max={100000}
                  step={100}
                  value={apiConfig.maxTokens}
                  onChange={(_, value) => controller.updateAPIConfig('maxTokens', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>
                  Maximum number of tokens to generate
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Top P: {apiConfig.topP}</FormLabel>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={apiConfig.topP}
                  onChange={(value) => controller.updateAPIConfig('topP', value)}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <FormHelperText>
                  Controls diversity via nucleus sampling
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>System Prompt</FormLabel>
                <Textarea
                  value={apiConfig.systemPrompt}
                  onChange={(e) => controller.updateAPIConfig('systemPrompt', e.target.value)}
                  placeholder="Enter a system prompt to set Claude's behavior"
                  rows={4}
                />
                <FormHelperText>
                  System prompt is sent at the beginning of conversations to guide Claude's behavior
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Custom Stop Sequences</FormLabel>
                <Textarea
                  value={apiConfig.customStopSequences.join('\n')}
                  onChange={(e) => {
                    const stopSequences = e.target.value
                      .split('\n')
                      .map(s => s.trim())
                      .filter(s => s !== '');
                    
                    controller.updateAPIConfig('customStopSequences', stopSequences);
                  }}
                  placeholder="Enter custom stop sequences, one per line"
                  rows={3}
                />
                <FormHelperText>
                  Sequences that will cause Claude to stop generating (one per line)
                </FormHelperText>
              </FormControl>
            </VStack>
          </TabPanel>
          
          {/* Appearance Settings Panel */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Theme Mode</FormLabel>
                <Select
                  value={themeConfig.mode}
                  onChange={(e) => controller.updateThemeConfig('mode', e.target.value as any)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System (Auto)</option>
                </Select>
                <FormHelperText>
                  Select application color theme
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Accent Color</FormLabel>
                <Input
                  type="color"
                  value={themeConfig.accentColor}
                  onChange={(e) => controller.updateThemeConfig('accentColor', e.target.value)}
                />
                <FormHelperText>
                  Primary accent color for the application
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Font Size: {themeConfig.fontSize}px</FormLabel>
                <Slider
                  min={10}
                  max={20}
                  step={1}
                  value={themeConfig.fontSize}
                  onChange={(value) => controller.updateThemeConfig('fontSize', value)}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <FormHelperText>
                  Base font size for text in the application
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Font Family</FormLabel>
                <Select
                  value={themeConfig.fontFamily}
                  onChange={(e) => controller.updateThemeConfig('fontFamily', e.target.value)}
                >
                  <option value="Inter, system-ui, sans-serif">Inter (Default)</option>
                  <option value="'SF Pro Display', system-ui, sans-serif">SF Pro (Apple)</option>
                  <option value="'Segoe UI', system-ui, sans-serif">Segoe UI (Windows)</option>
                  <option value="'Roboto', system-ui, sans-serif">Roboto (Google)</option>
                  <option value="'Fira Sans', system-ui, sans-serif">Fira Sans</option>
                  <option value="monospace">Monospace</option>
                </Select>
                <FormHelperText>
                  Font family used throughout the application
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Custom CSS</FormLabel>
                <Textarea
                  value={themeConfig.customCss || ''}
                  onChange={(e) => controller.updateThemeConfig('customCss', e.target.value)}
                  placeholder="/* Add custom CSS rules here */"
                  fontFamily="monospace"
                  rows={5}
                />
                <FormHelperText>
                  Advanced: Add custom CSS styling rules
                </FormHelperText>
              </FormControl>
            </VStack>
          </TabPanel>
          
          {/* Editor Settings Panel */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Auto-Complete</FormLabel>
                <Switch
                  isChecked={editorConfig.autoComplete}
                  onChange={() => controller.updateEditorConfig('autoComplete', !editorConfig.autoComplete)}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Spell Check</FormLabel>
                <Switch
                  isChecked={editorConfig.spellCheck}
                  onChange={() => controller.updateEditorConfig('spellCheck', !editorConfig.spellCheck)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Tab Size</FormLabel>
                <NumberInput
                  min={1}
                  max={8}
                  value={editorConfig.tabSize}
                  onChange={(_, value) => controller.updateEditorConfig('tabSize', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>
                  Number of spaces for a tab character
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Key Bindings</FormLabel>
                <Select
                  value={editorConfig.keyBindings}
                  onChange={(e) => controller.updateEditorConfig('keyBindings', e.target.value as any)}
                >
                  <option value="default">Default</option>
                  <option value="vim">Vim</option>
                  <option value="emacs">Emacs</option>
                </Select>
                <FormHelperText>
                  Keyboard shortcuts style for editor
                </FormHelperText>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Show Line Numbers</FormLabel>
                <Switch
                  isChecked={editorConfig.showLineNumbers}
                  onChange={() => controller.updateEditorConfig('showLineNumbers', !editorConfig.showLineNumbers)}
                />
              </FormControl>
            </VStack>
          </TabPanel>
          
          {/* Interface Settings Panel */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Sidebar Visible by Default</FormLabel>
                <Switch
                  isChecked={interfaceConfig.sidebarVisible}
                  onChange={() => controller.updateInterfaceConfig('sidebarVisible', !interfaceConfig.sidebarVisible)}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Compact Mode</FormLabel>
                <Switch
                  isChecked={interfaceConfig.compactMode}
                  onChange={() => controller.updateInterfaceConfig('compactMode', !interfaceConfig.compactMode)}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Show Timestamps</FormLabel>
                <Switch
                  isChecked={interfaceConfig.showTimestamps}
                  onChange={() => controller.updateInterfaceConfig('showTimestamps', !interfaceConfig.showTimestamps)}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Show Conversation Preview</FormLabel>
                <Switch
                  isChecked={interfaceConfig.conversationPreview}
                  onChange={() => controller.updateInterfaceConfig('conversationPreview', !interfaceConfig.conversationPreview)}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Group Sequential Messages</FormLabel>
                <Switch
                  isChecked={interfaceConfig.messageGrouping}
                  onChange={() => controller.updateInterfaceConfig('messageGrouping', !interfaceConfig.messageGrouping)}
                />
              </FormControl>
            </VStack>
          </TabPanel>
          
          {/* Storage Settings Panel */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Auto-Save Interval (seconds)</FormLabel>
                <NumberInput
                  min={5}
                  max={300}
                  value={storageConfig.autoSaveInterval}
                  onChange={(_, value) => controller.updateStorageConfig('autoSaveInterval', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>
                  How often to automatically save conversations
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Maximum Conversations</FormLabel>
                <NumberInput
                  min={0}
                  max={1000}
                  value={storageConfig.maxConversations}
                  onChange={(_, value) => controller.updateStorageConfig('maxConversations', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>
                  Maximum number of conversations to store (0 for unlimited)
                </FormHelperText>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Enable Automatic Backups</FormLabel>
                <Switch
                  isChecked={storageConfig.backupEnabled}
                  onChange={() => controller.updateStorageConfig('backupEnabled', !storageConfig.backupEnabled)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Backup Interval (days)</FormLabel>
                <NumberInput
                  min={1}
                  max={30}
                  value={storageConfig.backupInterval}
                  onChange={(_, value) => controller.updateStorageConfig('backupInterval', value)}
                  isDisabled={!storageConfig.backupEnabled}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>
                  How often to create automatic backups
                </FormHelperText>
              </FormControl>
              
              <Box mt={4}>
                <Button colorScheme="blue" onClick={() => controller.createBackup()}>
                  Create Backup Now
                </Button>
              </Box>
            </VStack>
          </TabPanel>
          
          {/* Advanced Settings Panel */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Box
                p={4}
                borderWidth={1}
                borderRadius="md"
                borderColor="red.300"
                bg="red.50"
                _dark={{ bg: 'red.900', borderColor: 'red.600' }}
              >
                <Text fontWeight="bold" color="red.600" _dark={{ color: 'red.300' }}>
                  Reset Settings
                </Text>
                <Text fontSize="sm" mt={2}>
                  This will reset all settings to their default values. This action cannot be undone.
                </Text>
                <Button colorScheme="red" size="sm" mt={3} onClick={onOpen}>
                  Reset All Settings
                </Button>
              </Box>
              
              <Divider />
              
              <Box>
                <Text fontWeight="bold" mb={2}>
                  Import/Export Settings
                </Text>
                <HStack>
                  <Button onClick={handleExportSettings}>
                    Export Settings
                  </Button>
                  <Button as="label" cursor="pointer">
                    Import Settings
                    <input
                      type="file"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={handleImportSettings}
                    />
                  </Button>
                </HStack>
                <Text fontSize="sm" mt={2} color="gray.500">
                  Export your settings to a JSON file or import settings from a previously exported file.
                </Text>
              </Box>
              
              <Divider />
              
              <Box>
                <Text fontWeight="bold" mb={2}>
                  Debug Logging
                </Text>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>Enable Debug Mode</FormLabel>
                  <Switch
                    isChecked={debug_mode}
                    onChange={() => controller.toggleDebugMode()}
                  />
                </FormControl>
                <Text fontSize="sm" mt={2} color="gray.500">
                  Enables detailed logging for troubleshooting. This may affect performance.
                </Text>
              </Box>
              
              <Divider />
              
              <Box>
                <Text fontWeight="bold" mb={2}>
                  Application Information
                </Text>
                <VStack align="stretch" spacing={1}>
                  <Flex justify="space-between">
                    <Text fontSize="sm">Version:</Text>
                    <Badge>1.0.0</Badge>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontSize="sm">Electron:</Text>
                    <Badge>25.0.0</Badge>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontSize="sm">React:</Text>
                    <Badge>18.2.0</Badge>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontSize="sm">Node.js:</Text>
                    <Badge>18.16.0</Badge>
                  </Flex>
                </VStack>
              </Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Reset Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Reset Settings
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? All settings will be reset to their default values.
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleResetSettings} ml={3}>
                Reset
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
});

export default SettingsView;
