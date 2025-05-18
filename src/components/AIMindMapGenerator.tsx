import React, { useState } from 'react';
import styled from 'styled-components';
import { generateMindMap, GenerationOptions, InputSource, NodeType } from '../utils/aiService';
import { MindMapData } from '../types/MindMap';
import { FiFileText, FiGlobe, FiEdit3, FiLoader, FiX } from 'react-icons/fi';
import Icon from './Icon';

interface AIMindMapGeneratorProps {
  onMapGenerated: (data: MindMapData) => void;
  onClose: () => void;
  isDarkMode: boolean;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div<{ isDarkMode: boolean }>`
  background-color: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#222222'};
  border-radius: 12px;
  padding: 24px;
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 16px;
`;

const SourceSelect = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const SourceOption = styled.button<{ isSelected: boolean; isDarkMode: boolean }>`
  flex: 1;
  padding: 12px;
  background-color: ${props => props.isSelected 
    ? (props.isDarkMode ? '#4a6fa5' : '#e6f0ff') 
    : (props.isDarkMode ? '#3d3d3d' : '#f5f5f5')};
  color: ${props => props.isSelected 
    ? (props.isDarkMode ? '#ffffff' : '#1a73e8') 
    : (props.isDarkMode ? '#dddddd' : '#444444')};
  border: ${props => props.isSelected 
    ? (props.isDarkMode ? '1px solid #6e9eff' : '1px solid #1a73e8') 
    : (props.isDarkMode ? '1px solid #555555' : '1px solid #dddddd')};
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.isDarkMode ? '#4a6fa5' : '#e6f0ff'};
  }
`;

const TextInput = styled.textarea<{ isDarkMode: boolean }>`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: ${props => props.isDarkMode ? '1px solid #555555' : '1px solid #dddddd'};
  background-color: ${props => props.isDarkMode ? '#3d3d3d' : '#ffffff'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.isDarkMode ? '#6e9eff' : '#1a73e8'};
  }
`;

const URLInput = styled.input<{ isDarkMode: boolean }>`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: ${props => props.isDarkMode ? '1px solid #555555' : '1px solid #dddddd'};
  background-color: ${props => props.isDarkMode ? '#3d3d3d' : '#ffffff'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  font-family: inherit;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.isDarkMode ? '#6e9eff' : '#1a73e8'};
  }
`;

const NodeTypeSelect = styled.div`
  display: flex;
  gap: 10px;
`;

const NodeTypeOption = styled.button<{ isSelected: boolean; isDarkMode: boolean; nodeType: string }>`
  flex: 1;
  padding: 10px;
  background-color: ${props => props.isSelected 
    ? (props.isDarkMode ? '#4a6fa5' : '#e6f0ff') 
    : (props.isDarkMode ? '#3d3d3d' : '#f5f5f5')};
  color: ${props => props.isSelected 
    ? (props.isDarkMode ? '#ffffff' : '#1a73e8') 
    : (props.isDarkMode ? '#dddddd' : '#444444')};
  border: ${props => props.isSelected 
    ? (props.isDarkMode ? '1px solid #6e9eff' : '1px solid #1a73e8') 
    : (props.isDarkMode ? '1px solid #555555' : '1px solid #dddddd')};
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;

  /* Add specific styling based on node type */
  ${props => props.nodeType === 'keyPoint' && `
    border-style: ${props.isSelected ? 'solid' : 'dashed'};
    font-weight: 600;
  `}
  
  ${props => props.nodeType === 'note' && `
    font-style: italic;
  `}

  &:hover {
    background-color: ${props => props.isDarkMode ? '#4a6fa5' : '#e6f0ff'};
  }
`;

const GenerateButton = styled.button<{ isDarkMode: boolean; isLoading: boolean }>`
  padding: 14px;
  background-color: ${props => props.isLoading 
    ? (props.isDarkMode ? '#666666' : '#cccccc') 
    : (props.isDarkMode ? '#4a6fa5' : '#1a73e8')};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: ${props => props.isLoading ? 'not-allowed' : 'pointer'};
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.isLoading 
      ? (props.isDarkMode ? '#666666' : '#cccccc') 
      : (props.isDarkMode ? '#3a5a8c' : '#1565c0')};
  }
`;

const LoadingSpinner = styled.div`
  animation: spin 1.5s linear infinite;
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const AIMindMapGenerator: React.FC<AIMindMapGeneratorProps> = ({ 
  onMapGenerated, 
  onClose,
  isDarkMode
}) => {
  // State for input type, content, and other options
  const [inputType, setInputType] = useState<InputSource>('text');
  const [content, setContent] = useState('');
  const [rootNodeType, setRootNodeType] = useState<NodeType>('keyPoint');
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please enter some content to generate a mind map.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const options: GenerationOptions = {
        inputType,
        content,
        rootNodeType,
        maxDepth: 2,
        maxBranches: 5
      };
      
      const generatedMap = await generateMindMap(options);
      onMapGenerated(generatedMap);
      onClose();
    } catch (error) {
      console.error('Error generating mind map:', error);
      alert('Failed to generate mind map. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent isDarkMode={isDarkMode} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <ModalHeader>
          <Title>Generate Mind Map with AI</Title>
          <CloseButton onClick={onClose}>
            <Icon icon={FiX} />
          </CloseButton>
        </ModalHeader>
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Select Input Source</Label>
            <SourceSelect>
              <SourceOption 
                type="button"
                isSelected={inputType === 'text'} 
                isDarkMode={isDarkMode}
                onClick={() => setInputType('text')}
              >
                <Icon icon={FiEdit3} />
                Text
              </SourceOption>
              <SourceOption 
                type="button"
                isSelected={inputType === 'url'} 
                isDarkMode={isDarkMode}
                onClick={() => setInputType('url')}
              >
                <Icon icon={FiGlobe} />
                Website URL
              </SourceOption>
              <SourceOption 
                type="button"
                isSelected={inputType === 'file'} 
                isDarkMode={isDarkMode}
                onClick={() => setInputType('file')}
              >
                <Icon icon={FiFileText} />
                File Upload
              </SourceOption>
            </SourceSelect>
          </InputGroup>
          
          <InputGroup>
            <Label>
              {inputType === 'text' && 'Enter your text'}
              {inputType === 'url' && 'Enter website URL'}
              {inputType === 'file' && 'Upload a file (PDF, DOCX, TXT)'}
            </Label>
            
            {inputType === 'text' && (
              <TextInput 
                isDarkMode={isDarkMode}
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                placeholder="Enter text to generate a mind map. The more detailed your text, the better the mind map."
              />
            )}
            
            {inputType === 'url' && (
              <URLInput 
                isDarkMode={isDarkMode}
                value={content}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContent(e.target.value)}
                placeholder="Enter a URL (e.g., https://example.com)"
              />
            )}
            
            {inputType === 'file' && (
              <p>File upload functionality would be implemented in a production environment.</p>
              // In a real implementation, this would be a file upload component
            )}
          </InputGroup>
          
          <InputGroup>
            <Label>Root Node Type</Label>
            <NodeTypeSelect>
              <NodeTypeOption 
                type="button"
                isSelected={rootNodeType === 'default'} 
                isDarkMode={isDarkMode}
                nodeType="default"
                onClick={() => setRootNodeType('default')}
              >
                Default
              </NodeTypeOption>
              <NodeTypeOption 
                type="button"
                isSelected={rootNodeType === 'keyPoint'} 
                isDarkMode={isDarkMode}
                nodeType="keyPoint"
                onClick={() => setRootNodeType('keyPoint')}
              >
                Key Point
              </NodeTypeOption>
              <NodeTypeOption 
                type="button"
                isSelected={rootNodeType === 'note'} 
                isDarkMode={isDarkMode}
                nodeType="note"
                onClick={() => setRootNodeType('note')}
              >
                Note
              </NodeTypeOption>
            </NodeTypeSelect>
          </InputGroup>
          
          <GenerateButton 
            type="submit" 
            isDarkMode={isDarkMode}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner>
                  <Icon icon={FiLoader} />
                </LoadingSpinner>
                Generating...
              </>
            ) : (
              'Generate Mind Map'
            )}
          </GenerateButton>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AIMindMapGenerator; 