import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { MindMapNode, Position, TextFormatting, ConnectionPoint as ConnectionPointType, ConnectionPointPosition } from '../types/MindMap';
import { 
  FiPlus, 
  FiX, 
  FiEdit3, 
  FiBold, 
  FiItalic, 
  FiUnderline, 
  FiAlignLeft, 
  FiAlignCenter, 
  FiAlignRight, 
  FiAlignJustify, 
  FiType,
  FiRefreshCw
} from 'react-icons/fi';
import Icon from './Icon';
import ConnectionPoint from './ConnectionPoint';

const NodeWrapper = styled.div<{ 
  isSelected: boolean; 
  isPotentialParent: boolean;
  isDarkMode: boolean;
  type?: string;
  isWireMode?: boolean;
  isConnectionSource?: boolean;
}>`
  position: absolute;
  min-width: 200px;
  max-width: 400px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: ${props => props.isWireMode ? 'crosshair' : 'grab'};
  user-select: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  
  &:active {
    cursor: ${props => props.isWireMode ? 'crosshair' : 'grabbing'};
  }
  
  // Excalidraw-style hand-drawn border effect
  &:before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 10px;
    background: ${props => {
      if (props.isConnectionSource) return props.isDarkMode ? 'rgba(52, 168, 83, 0.2)' : 'rgba(52, 168, 83, 0.2)';
      if (props.isSelected) return props.isDarkMode ? '#6e9eff40' : '#4285f440';
      if (props.isPotentialParent) return props.isDarkMode ? '#34a85340' : '#34a85340';
      if (props.isWireMode) return props.isDarkMode ? 'rgba(110, 158, 255, 0.1)' : 'rgba(66, 133, 244, 0.1)';
      return 'transparent';
    }};
    z-index: -1;
    pointer-events: none;
  }

  ${props => props.isWireMode && `
    &:hover {
      &:after {
        content: '${props.isConnectionSource ? "Connection source" : props.isSelected ? "Drag from here" : "Click to connect"}';
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: ${props.isDarkMode ? '#3d3d3d' : '#f0f0f0'};
        color: ${props.isDarkMode ? '#fff' : '#333'};
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
      }
    }
  `}

  // Hand-drawn border styles based on node type
  ${props => {
    const borderColor = props.isDarkMode ? 
      (props.isConnectionSource ? '#34a853' : 
       props.isSelected ? '#6e9eff' : 
       props.isWireMode ? 'rgba(110, 158, 255, 0.5)' : 
       'rgba(255, 255, 255, 0.3)') : 
      (props.isConnectionSource ? '#34a853' : 
       props.isSelected ? '#4285f4' : 
       props.isWireMode ? 'rgba(66, 133, 244, 0.5)' : 
       'rgba(0, 0, 0, 0.1)');
    
    const getBorderStyle = () => {
      switch (props.type) {
        case 'keyPoint':
          return `
            border: 2px solid ${borderColor};
            box-shadow: 2px 2px 0 ${borderColor};
          `;
        case 'note':
          return `
            border: 2px dashed ${borderColor};
            box-shadow: 2px 2px 0 ${borderColor};
          `;
        default:
          return `
            border: 2px solid ${borderColor};
            box-shadow: 1px 1px 0 ${borderColor},
                      2px 2px 0 ${borderColor};
          `;
      }
    };

    return getBorderStyle();
  }}

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 ${props => props.isDarkMode ? 
      (props.isConnectionSource ? '#34a853' : 
       props.isSelected ? '#6e9eff' : 
       props.isWireMode ? 'rgba(110, 158, 255, 0.5)' : 
       'rgba(255, 255, 255, 0.3)') : 
      (props.isConnectionSource ? '#34a853' : 
       props.isSelected ? '#4285f4' : 
       props.isWireMode ? 'rgba(66, 133, 244, 0.5)' : 
       'rgba(0, 0, 0, 0.1)')};
  }
`;

const FormattingToolbar = styled.div<{ isDarkMode: boolean; isVisible: boolean }>`
  position: absolute;
  bottom: -40px;
  left: 0;
  right: 0;
  height: 36px;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 6px;
  opacity: ${props => props.isVisible ? 1 : 0};
  transform: translateY(${props => props.isVisible ? '0' : '-10px'});
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px ${props => props.isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'};
  z-index: 10;
`;

const LineIndicator = styled.div<{ isDarkMode: boolean }>`
  font-size: 11px;
  padding: 2px 5px;
  background: ${props => props.isDarkMode ? '#444' : '#f0f0f0'};
  color: ${props => props.isDarkMode ? '#c0c0c0' : '#666666'};
  border-radius: 3px;
  margin-left: auto;
  margin-right: 4px;
`;

const FormatDivider = styled.div<{ isDarkMode: boolean }>`
  width: 1px;
  height: 24px;
  background: ${props => props.isDarkMode ? '#444' : '#e5e5e5'};
  margin: 0 4px;
`;

const FormatButton = styled.button<{ isDarkMode: boolean; isActive?: boolean }>`
  width: 28px;
  height: 28px;
  border: none;
  background: ${props => props.isActive 
    ? (props.isDarkMode ? '#4a6fa5' : '#e6f0ff') 
    : 'transparent'};
  color: ${props => {
    if (props.isActive) return props.isDarkMode ? '#ffffff' : '#1a73e8';
    return props.isDarkMode ? '#c0c0c0' : '#666666';
  }};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.isDarkMode ? '#3d3d3d' : '#f0f0f0'};
    color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const FontSelect = styled.select<{ isDarkMode: boolean }>`
  height: 28px;
  padding: 0 6px;
  border: 1px solid ${props => props.isDarkMode ? '#444' : '#e5e5e5'};
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  color: ${props => props.isDarkMode ? '#c0c0c0' : '#666666'};
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  outline: none;
  
  &:focus {
    border-color: ${props => props.isDarkMode ? '#6e9eff' : '#4285f4'};
  }
  
  option {
    background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  }
`;

const TextArea = styled.textarea<{ 
  isDarkMode: boolean; 
  type: string;
  formatting?: TextFormatting;
}>`
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: none;
  background: transparent;
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  font-family: ${props => {
    if (props.formatting?.fontFamily) return props.formatting.fontFamily;
    
    // Use Virgil as the default font
    return "'Virgil', 'Segoe UI', system-ui, -apple-system, sans-serif";
  }};
  font-size: ${props => props.formatting?.fontSize ? `${props.formatting.fontSize}px` : '14px'};
  font-weight: ${props => props.formatting?.bold ? 'bold' : props.type === 'keyPoint' ? '600' : '400'};
  line-height: 1.5;
  resize: none;
  outline: none;
  overflow: hidden;
  text-align: ${props => props.formatting?.textAlign || 'left'};
  font-style: ${props => props.formatting?.italic ? 'italic' : 'normal'};
  text-decoration: ${props => props.formatting?.underline ? 'underline' : 'none'};

  &::placeholder {
    color: ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};
  }
  
  // Add a custom highlight effect for the current line
  &:focus {
    background-image: linear-gradient(
      to bottom,
      transparent 0px,
      transparent calc(1.5em * var(--current-line, 0) - 2px),
      ${props => props.isDarkMode ? 'rgba(110, 158, 255, 0.1)' : 'rgba(66, 133, 244, 0.1)'} calc(1.5em * var(--current-line, 0) - 2px),
      ${props => props.isDarkMode ? 'rgba(110, 158, 255, 0.1)' : 'rgba(66, 133, 244, 0.1)'} calc(1.5em * var(--current-line, 0) + 1.5em - 2px),
      transparent calc(1.5em * var(--current-line, 0) + 1.5em - 2px),
      transparent 100%
    );
  }
`;

// Create a styled component for displaying formatted text with line-by-line alignment
const FormattedText = styled.div<{
  isDarkMode: boolean;
  type: string;
  formatting?: TextFormatting;
}>`
  width: 100%;
  min-height: 60px;
  padding: 8px;
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  font-family: ${props => {
    if (props.formatting?.fontFamily) return props.formatting.fontFamily;
    return "'Virgil', 'Segoe UI', system-ui, -apple-system, sans-serif";
  }};
  font-size: ${props => props.formatting?.fontSize ? `${props.formatting.fontSize}px` : '14px'};
  font-weight: ${props => props.formatting?.bold ? 'bold' : props.type === 'keyPoint' ? '600' : '400'};
  line-height: 1.5;
  font-style: ${props => props.formatting?.italic ? 'italic' : 'normal'};
  text-decoration: ${props => props.formatting?.underline ? 'underline' : 'none'};
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;

const TextLine = styled.div<{
  align?: string;
}>`
  text-align: ${props => props.align || 'left'};
`;

const NodeControls = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  top: -40px;
  right: 0;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 2px 8px ${props => props.isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'};
  z-index: 10;

  ${NodeWrapper}:hover & {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ControlButton = styled.button<{ isDarkMode: boolean }>`
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: ${props => props.isDarkMode ? '#c0c0c0' : '#666666'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.isDarkMode ? '#3d3d3d' : '#f0f0f0'};
    color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const TypeMenu = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  top: -80px;
  right: 0;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  border-radius: 6px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 2px 8px ${props => props.isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'};
`;

const TypeOption = styled.button<{ isSelected: boolean; isDarkMode: boolean }>`
  padding: 6px 12px;
  border: none;
  background: ${props => props.isSelected ? 
    (props.isDarkMode ? '#4a6fa5' : '#e6f0ff') : 
    'transparent'};
  color: ${props => props.isDarkMode ? 
    (props.isSelected ? '#ffffff' : '#c0c0c0') : 
    (props.isSelected ? '#1a73e8' : '#666666')};
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.isDarkMode ? '#3d3d3d' : '#f0f0f0'};
    color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  }
`;

interface NodeProps {
  node: MindMapNode;
  isSelected: boolean;
  isPotentialParent: boolean;
  onClick: () => void;
  onAddChild: () => void;
  onTextChange: (text: string) => void;
  onDelete: () => void;
  onDragStart: (nodeId: string, offset: Position, initialPosition: Position) => void;
  onDrag: (nodeId: string, x: number, y: number) => void;
  onDragEnd: () => void;
  onTypeChange: (nodeId: string, type: string) => void;
  onFormattingChange: (nodeId: string, formatting: TextFormatting) => void;
  scale: number;
  translateX: number;
  translateY: number;
  isDarkMode: boolean;
  isWireMode?: boolean;
  isConnectionSource?: boolean;
  onConnectionPointClick?: (connectionPoint: ConnectionPointType) => void;
  activeConnectionPoint?: ConnectionPointType | null;
  pendingConnectionSource?: ConnectionPointType | null;
  isConnecting: boolean;
}

const Node: React.FC<NodeProps> = ({
  node,
  isSelected,
  isPotentialParent,
  onClick,
  onAddChild,
  onTextChange,
  onDelete,
  onDragStart,
  onDrag,
  onDragEnd,
  onTypeChange,
  onFormattingChange,
  scale,
  translateX,
  translateY,
  isDarkMode,
  isWireMode,
  isConnectionSource,
  onConnectionPointClick,
  activeConnectionPoint,
  pendingConnectionSource,
  isConnecting
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const initialMousePosRef = useRef<Position | null>(null);
  const initialNodePosRef = useRef<Position | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textArea = textAreaRef.current;
    if (textArea && isEditing) {
      textArea.style.height = 'auto';
      textArea.style.height = `${textArea.scrollHeight}px`;
      
      // Set the CSS variable for line highlighting
      textArea.style.setProperty('--current-line', currentLine.toString());
    }
  }, [node.text, node.formatting, isEditing, currentLine]);

  // Parse text into lines for individual alignment
  const getFormattedLines = () => {
    const lines = node.text.split('\n');
    const alignmentDefault = node.formatting?.textAlign || 'left';
    
    // Check if the text has line-specific alignments
    const lineAlignments = node.formatting?.lineAlignments || {};
    
    return lines.map((line, index) => (
      <TextLine 
        key={index} 
        align={lineAlignments[index] || alignmentDefault}
      >
        {line || ' '}
      </TextLine>
    ));
  };

  // Handle text change and maintain cursor position
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value);
  };

  // Update current line based on cursor position
  const handleCursorMove = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const text = textarea.value;
    const selectionStart = textarea.selectionStart;
    
    // Find the current line number based on cursor position
    const textBeforeCursor = text.substring(0, selectionStart);
    const newLineNumber = (textBeforeCursor.match(/\n/g) || []).length;
    
    if (newLineNumber !== currentLine) {
      setCurrentLine(newLineNumber);
    }
  };

  // Handle text formatting changes
  const updateFormatting = (property: keyof TextFormatting, value: any) => {
    const currentFormatting = node.formatting || {};
    const newFormatting = {
      ...currentFormatting,
      [property]: value
    };
    
    onFormattingChange(node.id, newFormatting);
  };

  // Toggle boolean formatting properties
  const toggleFormatting = (property: 'bold' | 'italic' | 'underline') => {
    const currentFormatting = node.formatting || {};
    updateFormatting(property, !currentFormatting[property]);
  };

  // Update alignment for current line only
  const updateLineAlignment = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    if (!isEditing || !textAreaRef.current) return;
    
    const textarea = textAreaRef.current;
    const text = textarea.value;
    const selectionStart = textarea.selectionStart;
    
    // Find the current line number based on cursor position
    const textBeforeCursor = text.substring(0, selectionStart);
    const currentLineNumber = (textBeforeCursor.match(/\n/g) || []).length;
    
    // Get current formatting or initialize empty object
    const currentFormatting = node.formatting || {};
    const currentLineAlignments = currentFormatting.lineAlignments || {};
    
    // Update alignment for current line
    const newLineAlignments = {
      ...currentLineAlignments,
      [currentLineNumber]: alignment
    };
    
    // Update formatting with new line alignments
    const newFormatting = {
      ...currentFormatting,
      lineAlignments: newLineAlignments
    };
    
    onFormattingChange(node.id, newFormatting);
  };
  
  // Change font family
  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormatting('fontFamily', e.target.value);
  };

  // Handle mouse down on the node - start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click
    
    // Don't start dragging if we clicked on a control button or the text area
    if ((e.target as HTMLElement).tagName === 'BUTTON' || 
        (e.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }
    
    e.stopPropagation();
    e.preventDefault();
    
    // Store initial positions for calculating the drag offset
    initialMousePosRef.current = { x: e.clientX, y: e.clientY };
    initialNodePosRef.current = { x: node.x, y: node.y };
    
    setIsDragging(true);
    
    // Call the provided onDragStart prop with an empty offset (we'll calculate actual movement in handleMouseMove)
    onDragStart(node.id, { x: 0, y: 0 }, { x: node.x, y: node.y });
    
    // Add event listeners for mouse move and up events
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Handle mouse move - update node position during drag
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !initialMousePosRef.current || !initialNodePosRef.current) return;
    
    // Calculate how far the mouse has moved from the initial position
    const deltaX = (e.clientX - initialMousePosRef.current.x) / scale;
    const deltaY = (e.clientY - initialMousePosRef.current.y) / scale;
    
    // Calculate new node position based on initial position plus the delta
    const newX = initialNodePosRef.current.x + deltaX;
    const newY = initialNodePosRef.current.y + deltaY;
    
    // Call the provided onDrag prop with the new position
    onDrag(node.id, newX, newY);
  };

  // Handle mouse up - end dragging
  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    initialMousePosRef.current = null;
    initialNodePosRef.current = null;
    
    // Call the provided onDragEnd prop
    onDragEnd();
    
    // Remove event listeners
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  // Handle click on the node - select it
  const handleNodeClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onClick();
    }
  };

  // Update text area event handlers to include keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Apply alignment shortcuts only when format toolbar is visible
    if (showFormatting) {
      // Ctrl/Cmd + Shift + L/C/R/J for alignment
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'l': // Left align
            e.preventDefault();
            updateLineAlignment('left');
            break;
          case 'c': // Center align
            e.preventDefault();
            updateLineAlignment('center');
            break;
          case 'r': // Right align
            e.preventDefault();
            updateLineAlignment('right');
            break;
          case 'j': // Justify
            e.preventDefault();
            updateLineAlignment('justify');
            break;
        }
      }
    }
  };

  // Reset line formatting
  const resetLineFormatting = () => {
    // Get current formatting or initialize empty object
    const currentFormatting = node.formatting || {};
    const currentLineAlignments = currentFormatting.lineAlignments || {};
    
    // Create a new lineAlignments object without the current line
    const newLineAlignments = { ...currentLineAlignments };
    delete newLineAlignments[currentLine];
    
    // Update formatting with new line alignments
    const newFormatting = {
      ...currentFormatting,
      lineAlignments: Object.keys(newLineAlignments).length > 0 ? newLineAlignments : undefined
    };
    
    onFormattingChange(node.id, newFormatting);
  };

  // Enhance the edit button functionality
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setShowTypeMenu(false);
    setShowFormatting(false);
    
    // Focus on the textarea after a brief delay to ensure it's rendered
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
      }
    }, 10);
  };

  // In the Node component, add handling for the formatting, add child, and delete buttons
  const handleTypeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTypeMenu(!showTypeMenu);
    setShowFormatting(false);
  };

  const handleFormatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFormatting(!showFormatting);
    setShowTypeMenu(false);
  };

  const handleAddChildClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddChild();
    setShowTypeMenu(false);
    setShowFormatting(false);
    
    // Set a status message (if a status handling function is added to the component)
    setStatusMessage?.("Child node added");
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optional: Ask for confirmation before deleting
    if (window.confirm("Are you sure you want to delete this node? This will also remove any children connected to it.")) {
      onDelete();
    }
    
    setShowTypeMenu(false);
    setShowFormatting(false);
  };

  // Optional status handling function - only define if the parent component provides this
  const setStatusMessage = (message: string) => {
    // This is a stub - the actual implementation would depend on the parent component
    console.log(message);
  };

  const handleConnectionPointClick = (position: ConnectionPointPosition) => {
    if (onConnectionPointClick) {
      onConnectionPointClick({
        nodeId: node.id,
        position
      });
    }
  };

  const isConnectionPointActive = (position: ConnectionPointPosition): boolean => {
    if (!activeConnectionPoint) return false;
    return activeConnectionPoint.nodeId === node.id && 
           activeConnectionPoint.position === position;
  };

  const isPendingSource = (position: ConnectionPointPosition): boolean => {
    if (!pendingConnectionSource) return false;
    return pendingConnectionSource.nodeId === node.id && 
           pendingConnectionSource.position === position;
  };

  return (
    <NodeWrapper
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        zIndex: isSelected || isConnectionSource ? 2 : 1,
        // Add a subtle transition for non-dragging movements
        transition: isDragging ? 'none' : 'transform 0.1s ease'
      }}
      isSelected={isSelected}
      isPotentialParent={isPotentialParent}
      isConnectionSource={isConnectionSource}
      type={node.type || 'default'}
      isDarkMode={isDarkMode}
      isWireMode={isWireMode}
      onClick={handleNodeClick}
      onMouseDown={handleMouseDown}
    >
      {/* Connection points */}
      <ConnectionPoint 
        position="top"
        isActive={isConnectionPointActive('top') || isPendingSource('top')}
        isDarkMode={isDarkMode}
        isConnecting={isConnecting}
        onClick={() => handleConnectionPointClick('top')}
        nodeId={node.id}
      />
      <ConnectionPoint 
        position="right"
        isActive={isConnectionPointActive('right') || isPendingSource('right')}
        isDarkMode={isDarkMode}
        isConnecting={isConnecting}
        onClick={() => handleConnectionPointClick('right')}
        nodeId={node.id}
      />
      <ConnectionPoint 
        position="bottom"
        isActive={isConnectionPointActive('bottom') || isPendingSource('bottom')}
        isDarkMode={isDarkMode}
        isConnecting={isConnecting}
        onClick={() => handleConnectionPointClick('bottom')}
        nodeId={node.id}
      />
      <ConnectionPoint 
        position="left"
        isActive={isConnectionPointActive('left') || isPendingSource('left')}
        isDarkMode={isDarkMode}
        isConnecting={isConnecting}
        onClick={() => handleConnectionPointClick('left')}
        nodeId={node.id}
      />
      
      {isEditing ? (
        <TextArea
          ref={textAreaRef}
          value={node.text}
          onChange={handleTextChange}
          placeholder="Enter text..."
          isDarkMode={isDarkMode}
          type={node.type || 'default'}
          formatting={node.formatting}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          onBlur={() => setIsEditing(false)}
          autoFocus
          onInput={handleCursorMove}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <FormattedText 
          isDarkMode={isDarkMode}
          type={node.type || 'default'}
          formatting={node.formatting}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          
        >
          {getFormattedLines()}
        </FormattedText>
      )}
      
      <NodeControls isDarkMode={isDarkMode}>
        <ControlButton 
          isDarkMode={isDarkMode}
          onClick={handleEditClick}
          title="Edit node content"
        >
          <Icon icon={FiEdit3} />
        </ControlButton>
        <ControlButton 
          isDarkMode={isDarkMode}
          onClick={handleTypeClick}
          title="Change node type"
        >
          <Icon icon={FiType} />
        </ControlButton>
        <ControlButton 
          isDarkMode={isDarkMode}
          onClick={handleFormatClick}
          title="Format text"
        >
          <Icon icon={FiBold} />
        </ControlButton>
        <ControlButton 
          isDarkMode={isDarkMode}
          onClick={handleAddChildClick}
          title="Add child node"
        >
          <Icon icon={FiPlus} />
        </ControlButton>
        <ControlButton 
          isDarkMode={isDarkMode}
          onClick={handleDeleteClick}
          title="Delete node"
        >
          <Icon icon={FiX} />
        </ControlButton>
      </NodeControls>

      {showTypeMenu && (
        <TypeMenu isDarkMode={isDarkMode}>
          <TypeOption
            isDarkMode={isDarkMode}
            isSelected={!node.type || node.type === 'default'}
            onClick={() => {
              onTypeChange(node.id, 'default');
              setShowTypeMenu(false);
            }}
          >
            Default
          </TypeOption>
          <TypeOption
            isDarkMode={isDarkMode}
            isSelected={node.type === 'keyPoint'}
            onClick={() => {
              onTypeChange(node.id, 'keyPoint');
              setShowTypeMenu(false);
            }}
          >
            Key Point
          </TypeOption>
          <TypeOption
            isDarkMode={isDarkMode}
            isSelected={node.type === 'note'}
            onClick={() => {
              onTypeChange(node.id, 'note');
              setShowTypeMenu(false);
            }}
          >
            Note
          </TypeOption>
        </TypeMenu>
      )}
      
      {showFormatting && (
        <FormattingToolbar isDarkMode={isDarkMode} isVisible={showFormatting}>
          {/* Text Style Controls */}
          <FormatButton 
            isDarkMode={isDarkMode}
            isActive={node.formatting?.bold}
            onClick={() => toggleFormatting('bold')}
            title="Bold"
          >
            <Icon icon={FiBold} />
          </FormatButton>
          <FormatButton 
            isDarkMode={isDarkMode}
            isActive={node.formatting?.italic}
            onClick={() => toggleFormatting('italic')}
            title="Italic"
          >
            <Icon icon={FiItalic} />
          </FormatButton>
          <FormatButton 
            isDarkMode={isDarkMode}
            isActive={node.formatting?.underline}
            onClick={() => toggleFormatting('underline')}
            title="Underline"
          >
            <Icon icon={FiUnderline} />
          </FormatButton>
          
          <FormatDivider isDarkMode={isDarkMode} />
          
          {/* Text Alignment Controls - now apply to current line only */}
          <FormatButton 
            isDarkMode={isDarkMode}
            isActive={
              (node.formatting?.lineAlignments && 
               node.formatting.lineAlignments[currentLine] === 'left') ||
              (!node.formatting?.lineAlignments && 
               (!node.formatting?.textAlign || node.formatting?.textAlign === 'left'))
            }
            onClick={() => updateLineAlignment('left')}
            title="Align Current Line Left (Ctrl+Shift+L)"
          >
            <Icon icon={FiAlignLeft} />
          </FormatButton>
          <FormatButton 
            isDarkMode={isDarkMode}
            isActive={
              (node.formatting?.lineAlignments && 
               node.formatting.lineAlignments[currentLine] === 'center') ||
              (!node.formatting?.lineAlignments && 
               node.formatting?.textAlign === 'center')
            }
            onClick={() => updateLineAlignment('center')}
            title="Align Current Line Center (Ctrl+Shift+C)"
          >
            <Icon icon={FiAlignCenter} />
          </FormatButton>
          <FormatButton 
            isDarkMode={isDarkMode}
            isActive={
              (node.formatting?.lineAlignments && 
               node.formatting.lineAlignments[currentLine] === 'right') ||
              (!node.formatting?.lineAlignments && 
               node.formatting?.textAlign === 'right')
            }
            onClick={() => updateLineAlignment('right')}
            title="Align Current Line Right (Ctrl+Shift+R)"
          >
            <Icon icon={FiAlignRight} />
          </FormatButton>
          <FormatButton 
            isDarkMode={isDarkMode}
            isActive={
              (node.formatting?.lineAlignments && 
               node.formatting.lineAlignments[currentLine] === 'justify') ||
              (!node.formatting?.lineAlignments && 
               node.formatting?.textAlign === 'justify')
            }
            onClick={() => updateLineAlignment('justify')}
            title="Justify Current Line (Ctrl+Shift+J)"
          >
            <Icon icon={FiAlignJustify} />
          </FormatButton>
          
          <FormatDivider isDarkMode={isDarkMode} />
          
          {/* Font Family Selector */}
          <FontSelect 
            isDarkMode={isDarkMode}
            value={node.formatting?.fontFamily || ''}
            onChange={handleFontChange}
            title="Font Family"
          >
            <option value="">Virgil (Default)</option>
            <option value="'Arial', sans-serif">Arial</option>
            <option value="'Poppins', sans-serif">Poppins</option>
            <option value="'Roboto Mono', monospace">Roboto Mono</option>
            <option value="'Kalam', cursive">Kalam</option>
          </FontSelect>
          
          {/* Line indicator showing which line is being formatted */}
          <LineIndicator isDarkMode={isDarkMode}>
            Line {currentLine + 1}
          </LineIndicator>
          
          <FormatButton 
            isDarkMode={isDarkMode}
            onClick={resetLineFormatting}
            title="Reset current line formatting"
          >
            <Icon icon={FiRefreshCw} />
          </FormatButton>
        </FormattingToolbar>
      )}
    </NodeWrapper>
  );
};

export default Node; 