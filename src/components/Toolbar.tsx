import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  BsMoon, BsSun, 
  BsZoomIn, BsZoomOut, BsArrowsFullscreen, 
  BsQuestionCircle, BsStar, BsJournalText
} from 'react-icons/bs';
import { FiPlus, FiMove, FiMousePointer, FiLink, FiDownload, FiUpload, FiType, FiZap } from 'react-icons/fi';
import Icon from './Icon';

const ToolbarContainer = styled.div<{ isDarkMode: boolean }>`
  position: fixed;
  left: 50%;
  bottom: 50px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  border-radius: 8px;
  box-shadow: ${props => props.isDarkMode 
    ? '0 2px 12px rgba(0, 0, 0, 0.25)' 
    : '0 2px 12px rgba(0, 0, 0, 0.1)'};
  padding: 6px;
  z-index: 1000;
`;

const ToolbarSection = styled.div`
  display: flex;
  flex-direction: row;
  margin-right: 6px;
  
  &:last-child {
    margin-right: 0;
  }
`;

const ToolbarDivider = styled.div<{ isDarkMode: boolean }>`
  width: 1px;
  background-color: ${props => props.isDarkMode ? '#444444' : '#e0e0e0'};
  margin: 0 6px;
`;

const ToolButton = styled.button<{ isActive?: boolean; isDarkMode: boolean }>`
  width: 40px;
  height: 40px;
  border: none;
  background: ${props => props.isActive 
    ? (props.isDarkMode ? '#4d4d4d' : '#f0f0f0') 
    : 'transparent'};
  color: ${props => props.isActive
    ? (props.isDarkMode ? '#ffffff' : '#1a1a1a')
    : (props.isDarkMode ? '#c0c0c0' : '#666')};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  margin-right: 4px;
  position: relative;
  transition: all 0.2s ease;
  
  &:last-child {
    margin-right: 0;
  }
  
  &:hover {
    background: ${props => props.isDarkMode ? '#3d3d3d' : '#f5f5f5'};
    color: ${props => props.isDarkMode ? '#ffffff' : '#1a1a1a'};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const NodeTypeMenu = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  border-radius: 6px;
  box-shadow: ${props => props.isDarkMode ? '0 2px 12px rgba(0, 0, 0, 0.25)' : '0 2px 12px rgba(0, 0, 0, 0.1)'};
  padding: 6px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TypeText = styled.span`
  margin-left: 6px;
  font-size: 12px;
`;

const Tooltip = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 6px 10px;
  background: ${props => props.isDarkMode ? '#3d3d3d' : '#ffffff'};
  border-radius: 4px;
  box-shadow: ${props => props.isDarkMode 
    ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
    : '0 2px 8px rgba(0, 0, 0, 0.1)'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#1a1a1a'};
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 100;
  
  ${ToolButton}:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

const Shortcut = styled.span<{ isDarkMode: boolean }>`
  display: inline-block;
  margin-left: 6px;
  padding: 1px 4px;
  background: ${props => props.isDarkMode ? '#555555' : '#f0f0f0'};
  border-radius: 3px;
  color: ${props => props.isDarkMode ? '#c0c0c0' : '#666'};
  font-size: 10px;
  font-family: monospace;
`;

const ExportMenu = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  border-radius: 6px;
  box-shadow: ${props => props.isDarkMode ? '0 2px 12px rgba(0, 0, 0, 0.25)' : '0 2px 12px rgba(0, 0, 0, 0.1)'};
  padding: 6px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 150px;
`;

interface ToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onExport?: (format?: string) => void;
  onImport?: () => void;
  onHelp: () => void;
  onCreateNode: (type?: string) => void;
  onAIGenerate: () => void;
  onShowFontPreview: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolChange,
  isDarkMode,
  onToggleDarkMode,
  onZoomIn,
  onZoomOut,
  onResetView,
  onExport,
  onImport,
  onHelp,
  onCreateNode,
  onAIGenerate,
  onShowFontPreview
}) => {
  const [showNodeTypes, setShowNodeTypes] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  return (
    <ToolbarContainer isDarkMode={isDarkMode}>
      <ToolbarSection>
        <ToolButton
          isDarkMode={isDarkMode}
          isActive={activeTool === 'select'}
          onClick={() => onToolChange('select')}
          title="Select (V)"
        >
          <Icon icon={FiMousePointer} />
        </ToolButton>
        <ToolButton
          isDarkMode={isDarkMode}
          isActive={activeTool === 'node'}
          onClick={() => {
            onToolChange('node');
            setShowNodeTypes(prev => !prev);
          }}
          title="Add Node (N)"
        >
          <Icon icon={FiPlus} />
          
          {showNodeTypes && onCreateNode && (
            <NodeTypeMenu isDarkMode={isDarkMode}>
              <ToolButton 
                onClick={() => onCreateNode('default')}
                isDarkMode={isDarkMode}
              >
                <Icon icon={FiPlus} />
                <TypeText>Default</TypeText>
              </ToolButton>
              <ToolButton 
                onClick={() => onCreateNode('keyPoint')}
                isDarkMode={isDarkMode}
              >
                <Icon icon={BsStar} />
                <TypeText>Key Point</TypeText>
              </ToolButton>
              <ToolButton 
                onClick={() => onCreateNode('note')}
                isDarkMode={isDarkMode}
              >
                <Icon icon={BsJournalText} />
                <TypeText>Note</TypeText>
              </ToolButton>
            </NodeTypeMenu>
          )}
        </ToolButton>
        <ToolButton
          isDarkMode={isDarkMode}
          isActive={activeTool === 'wire'}
          onClick={() => {
            onToolChange('wire');
            alert("Connect Tool: Click one node, then click another to create a connection. Or click and drag from one node to another.");
          }}
          title="Connect Nodes (C)"
        >
          <Icon icon={FiLink} />
          <Tooltip isDarkMode={isDarkMode}>
            Connect <Shortcut isDarkMode={isDarkMode}>C</Shortcut>
            <small style={{ display: 'block', fontSize: '10px', marginTop: '2px' }}>Click node-to-node</small>
          </Tooltip>
        </ToolButton>
        <ToolButton
          isDarkMode={isDarkMode}
          isActive={activeTool === 'pan'}
          onClick={() => onToolChange('pan')}
          title="Pan (H)"
        >
          <Icon icon={FiMove} />
        </ToolButton>
      </ToolbarSection>
      
      <ToolbarDivider isDarkMode={isDarkMode} />
      
      <ToolbarSection>
        <ToolButton
          isDarkMode={isDarkMode}
          onClick={() => setShowExportOptions(prev => !prev)}
          title="Export"
        >
          <Icon icon={FiDownload} />
          
          {showExportOptions && (
            <ExportMenu isDarkMode={isDarkMode}>
              <ToolButton 
                onClick={() => {
                  if (onExport) {
                    onExport('json');
                  }
                  setShowExportOptions(false);
                }}
                isDarkMode={isDarkMode}
              >
                <TypeText>Export as JSON</TypeText>
              </ToolButton>
              <ToolButton 
                onClick={() => {
                  if (onExport) {
                    onExport('pdf');
                  }
                  setShowExportOptions(false);
                }}
                isDarkMode={isDarkMode}
              >
                <TypeText>Export as PDF</TypeText>
              </ToolButton>
              <ToolButton 
                onClick={() => {
                  if (onExport) {
                    onExport('image');
                  }
                  setShowExportOptions(false);
                }}
                isDarkMode={isDarkMode}
              >
                <TypeText>Export as Image</TypeText>
              </ToolButton>
            </ExportMenu>
          )}
        </ToolButton>
        
        <ToolButton
          isDarkMode={isDarkMode}
          onClick={onImport}
          title="Import"
        >
          <Icon icon={FiUpload} />
        </ToolButton>
        
        <ToolButton
          isDarkMode={isDarkMode}
          onClick={onAIGenerate}
          title="AI Generate"
        >
          <Icon icon={FiZap} />
        </ToolButton>
        <ToolButton
          isDarkMode={isDarkMode}
          onClick={onShowFontPreview}
          title="Font Preview"
        >
          <Icon icon={FiType} />
        </ToolButton>
      </ToolbarSection>
      
      <ToolbarDivider isDarkMode={isDarkMode} />
      
      <ToolbarSection>
        <ToolButton 
          onClick={onZoomIn}
          isDarkMode={isDarkMode}
        >
          <Icon icon={BsZoomIn} />
          <Tooltip isDarkMode={isDarkMode}>
            Zoom In <Shortcut isDarkMode={isDarkMode}>=</Shortcut>
          </Tooltip>
        </ToolButton>
        
        <ToolButton 
          onClick={onZoomOut}
          isDarkMode={isDarkMode}
        >
          <Icon icon={BsZoomOut} />
          <Tooltip isDarkMode={isDarkMode}>
            Zoom Out <Shortcut isDarkMode={isDarkMode}>-</Shortcut>
          </Tooltip>
        </ToolButton>
        
        <ToolButton 
          onClick={onResetView}
          isDarkMode={isDarkMode}
        >
          <Icon icon={BsArrowsFullscreen} />
          <Tooltip isDarkMode={isDarkMode}>
            Reset View <Shortcut isDarkMode={isDarkMode}>0</Shortcut>
          </Tooltip>
        </ToolButton>
      </ToolbarSection>
      
      <ToolbarDivider isDarkMode={isDarkMode} />
      
      <ToolbarSection>
        <ToolButton 
          onClick={onToggleDarkMode}
          isDarkMode={isDarkMode}
        >
          <Icon icon={isDarkMode ? BsSun : BsMoon} />
          <Tooltip isDarkMode={isDarkMode}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </Tooltip>
        </ToolButton>
        
        <ToolButton 
          onClick={onHelp}
          isDarkMode={isDarkMode}
        >
          <Icon icon={BsQuestionCircle} />
          <Tooltip isDarkMode={isDarkMode}>Help</Tooltip>
        </ToolButton>
      </ToolbarSection>
    </ToolbarContainer>
  );
};

export default Toolbar; 