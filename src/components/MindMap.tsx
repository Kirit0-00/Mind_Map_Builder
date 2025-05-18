import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { MindMapData, MindMapNode, Position, DragState, TextFormatting, ConnectionPoint, NodeConnection } from '../types/MindMap';
import Node from './Node';
import Connections from './Connections';
import Toolbar from './Toolbar';
import { v4 as uuidv4 } from 'uuid';
import { BiZoomIn, BiZoomOut, BiExpandAlt as BiReset } from 'react-icons/bi';
import Icon from './Icon';
import AIMindMapGenerator from './AIMindMapGenerator';
import FontPreview from './FontPreview';

const TREE_SPACING = {
  HORIZONTAL: 300,
  VERTICAL: 150,
  MIN_SIBLING_DISTANCE: 80
};

const MindMapContainer = styled.div<{ isDarkMode: boolean }>`
  width: 100%;
  height: 100vh;
  background: ${props => props.isDarkMode 
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' 
    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)'};
  position: relative;
  overflow: hidden;
  font-family: 'Virgil', 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: ${props => props.isDarkMode ? '#ffffff' : '#1a1a1a'};
  display: flex;
  flex-direction: column;
`;

const Canvas = styled.div<{ scale: number; translateX: number; translateY: number }>`
  width: 100%;
  height: 100%;
  position: relative;
  transform-origin: center;
  transform: scale(${props => props.scale}) translate(${props => props.translateX}px, ${props => props.translateY}px);
  transition: transform 0.1s ease-out;
`;

const CanvasContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

// Add grid background to canvas
const GridBackground = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: ${props => props.isDarkMode 
      ? `radial-gradient(#444 0.5px, transparent 0.5px), radial-gradient(#444 0.5px, transparent 0.5px)` 
      : `radial-gradient(#bbb 0.5px, transparent 0.5px), radial-gradient(#bbb 0.5px, transparent 0.5px)`
    };
    background-size: 40px 40px;
    background-position: 0 0, 20px 20px;
    opacity: ${props => props.isDarkMode ? 0.25 : 0.3};
  }
  
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.isDarkMode
      ? 'radial-gradient(circle at 15% 85%, rgba(101, 78, 163, 0.08) 0%, transparent 40%), radial-gradient(circle at 85% 15%, rgba(76, 161, 175, 0.08) 0%, transparent 40%)'
      : 'radial-gradient(circle at 15% 85%, rgba(66, 133, 244, 0.05) 0%, transparent 40%), radial-gradient(circle at 85% 15%, rgba(15, 157, 88, 0.05) 0%, transparent 40%)'
    };
  }
`;

const StatusBar = styled.div<{ isDarkMode: boolean }>`
  height: 28px;
  background: ${props => props.isDarkMode ? '#252525' : '#f1f1f1'};
  border-top: 1px solid ${props => props.isDarkMode ? '#333' : '#e0e0e0'};
  color: ${props => props.isDarkMode ? '#c0c0c0' : '#666'};
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 12px;
  user-select: none;
`;

const StatusItem = styled.div`
  margin-right: 16px;
  display: flex;
  align-items: center;
`;

const ViewControls = styled.div<{ isDarkMode: boolean }>`
  position: fixed;
  right: 20px;
  top: 70px;
  display: flex;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  border-radius: 8px;
  box-shadow: ${props => props.isDarkMode 
    ? '0 2px 12px rgba(0, 0, 0, 0.25)' 
    : '0 2px 12px rgba(0, 0, 0, 0.1)'};
  padding: 6px;
  z-index: 9999;
`;

const ViewButton = styled.button<{ isDarkMode: boolean }>`
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: ${props => props.isDarkMode ? '#c0c0c0' : '#666'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  
  &:hover {
    background: ${props => props.isDarkMode ? '#3d3d3d' : '#f0f0f0'};
    color: ${props => props.isDarkMode ? '#ffffff' : '#1a1a1a'};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const ZoomText = styled.div<{ isDarkMode: boolean }>`
  font-size: 12px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  color: ${props => props.isDarkMode ? '#c0c0c0' : '#666'};
`;

interface MindMapProps {
  initialData?: MindMapData;
}

const MindMap: React.FC<MindMapProps> = ({ initialData }) => {
  const [mindMapData, setMindMapData] = useState<MindMapData>(() => {
    if (initialData) {
      // Ensure we have a connections array
      return {
        ...initialData,
        connections: initialData.connections || []
      };
    } else {
      return {
        nodes: {},
        rootId: '',
        connections: []
      };
    }
  });

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [activeTool, setActiveTool] = useState('select');
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    nodeId: null,
    potentialParentId: null,
    offset: { x: 0, y: 0 },
    initialPosition: { x: 0, y: 0 },
    mode: null,
    wireStartNodeId: null
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  // New state for status bar
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [nodeCount, setNodeCount] = useState(0);

  // New state for AI generator modal
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Change the mousePosition state declaration
  const [mousePosition, setMousePosition] = useState<Position | undefined>(undefined);

  // Add state for showing font preview
  const [showFontPreview, setShowFontPreview] = useState(false);

  // In the MindMap component, add a new state to track the current source node for connections
  const [connectionSourceNode, setConnectionSourceNode] = useState<string | null>(null);

  // Add new state for connection points
  const [activeConnectionPoint, setActiveConnectionPoint] = useState<ConnectionPoint | null>(null);
  const [pendingConnectionSource, setPendingConnectionSource] = useState<ConnectionPoint | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Calculate node count whenever the mind map data changes
  useEffect(() => {
    setNodeCount(Object.keys(mindMapData.nodes).length);
  }, [mindMapData]);

  // Add defensive node access helper to the component
  const getNodeSafely = useCallback((nodes: Record<string, MindMapNode>, nodeId: string): MindMapNode | null => {
    const node = nodes[nodeId];
    if (!node) return null;
    
    // Ensure critical properties exist
    if (!node.parentIds) node.parentIds = [];
    if (!node.children) node.children = [];
    
    return node;
  }, []);

  const calculateTreeLayout = useCallback(() => {
    setMindMapData(prev => {
      const updatedNodes = { ...prev.nodes };
      const rootNode = getNodeSafely(updatedNodes, prev.rootId);
      
      if (!rootNode) {
        console.warn('Root node not found during layout calculation');
        return prev;
      }

      // Center the root node only if it's not manually positioned
      const isManualDrag = dragState.nodeId === prev.rootId && dragState.mode === 'move';
      const rootOriginalX = rootNode.x;
      const rootOriginalY = rootNode.y;

      if (!isManualDrag && !rootNode.manuallyPositioned) {
        rootNode.x = window.innerWidth / 2;
        rootNode.y = window.innerHeight / 2;
      }

      // Create levels map for radial layout (only for non-manually positioned nodes)
      const levels: { [level: number]: string[] } = { 0: [prev.rootId] };
      const processedNodes = new Set([prev.rootId]);
      const nodeAngles: { [key: string]: number } = {};

      // Build levels - refactored to avoid unsafe reference
      const buildLevels = () => {
        let currentLevel = 0;
        while (true) {
          const currentNodes = levels[currentLevel] || [];
          if (currentNodes.length === 0) break;

          const nextLevel = currentLevel + 1;
          levels[nextLevel] = [];
          
          currentNodes.forEach(nodeId => {
            const node = getNodeSafely(updatedNodes, nodeId);
            if (!node) return;
            
            node.children.forEach(childId => {
              if (!processedNodes.has(childId) && updatedNodes[childId]) {
                levels[nextLevel].push(childId);
                processedNodes.add(childId);
              }
            });
          });
          currentLevel++;
        }
      };
      buildLevels();

      // Position nodes in a radial layout (only non-manually positioned nodes)
      Object.entries(levels).forEach(([levelStr, nodeIds]) => {
        const level = parseInt(levelStr);
        if (level === 0) {
          if (isManualDrag || rootNode.manuallyPositioned) {
            rootNode.x = rootOriginalX;
            rootNode.y = rootOriginalY;
          }
          return;
        }

        const radius = level * TREE_SPACING.HORIZONTAL;
        const angleStep = (2 * Math.PI) / nodeIds.length;
        
        nodeIds.forEach((nodeId, index) => {
          const node = getNodeSafely(updatedNodes, nodeId);
          if (!node || node.manuallyPositioned) return;

          // Calculate angle based on parent position for better branch distribution
          let angle = index * angleStep;
          if (node.parentIds && node.parentIds.length > 0) {
            const parentAngles = node.parentIds
              .map(pid => nodeAngles[pid])
              .filter(a => a !== undefined);
            
            if (parentAngles.length > 0) {
              const avgParentAngle = parentAngles.reduce((a, b) => a + b) / parentAngles.length;
              angle = avgParentAngle + (index - nodeIds.length / 2) * (Math.PI / 6);
            }
          }
          
          nodeAngles[nodeId] = angle;
          
          // Position node
          node.x = rootNode.x + Math.cos(angle) * radius;
          node.y = rootNode.y + Math.sin(angle) * radius;
        });
      });

      // Prevent node overlap - but only move non-manually positioned nodes
      Object.values(updatedNodes).forEach(node => {
        if (!node || !node.id || node.manuallyPositioned) return;
        
        let iterations = 0;
        const maxIterations = 10;
        
        const checkOverlap = () => {
          let hasOverlap = false;
          Object.values(updatedNodes).forEach(otherNode => {
            if (!otherNode || !otherNode.id || node.id === otherNode.id) return;

            const dx = node.x - otherNode.x;
            const dy = node.y - otherNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < TREE_SPACING.MIN_SIBLING_DISTANCE) {
              hasOverlap = true;
              const angle = Math.atan2(dy, dx);
              const moveDistance = (TREE_SPACING.MIN_SIBLING_DISTANCE - distance) / 2;
              
              // Only move if not manually positioned
              if (!node.manuallyPositioned) {
                node.x += Math.cos(angle) * moveDistance;
                node.y += Math.sin(angle) * moveDistance;
              }
              
              // Only move the other node if it's not manually positioned
              if (!otherNode.manuallyPositioned) {
                otherNode.x -= Math.cos(angle) * moveDistance;
                otherNode.y -= Math.sin(angle) * moveDistance;
              }
            }
          });
          return hasOverlap;
        };

        while (iterations < maxIterations) {
          const hasOverlap = checkOverlap();
          if (!hasOverlap) break;
          iterations++;
        }
      });

      return { ...prev, nodes: updatedNodes };
    });
  }, [dragState, getNodeSafely]);

  const handleNodeDragStart = useCallback((nodeId: string, offset: Position, initialPosition: Position) => {
    if (activeTool === 'wire') {
      console.log('Wire mode activated! Starting drag from node:', nodeId);
      setDragState({
        nodeId,
        potentialParentId: null,
        offset,
        initialPosition,
        mode: 'wire',
        wireStartNodeId: nodeId
      });
      setStatusMessage('Drawing connection... Drag to target node!');
    } else {
      setDragState({
        nodeId,
        potentialParentId: null,
        offset,
        initialPosition,
        mode: 'move',
        wireStartNodeId: null
      });
      setStatusMessage('Moving node...');
    }
  }, [activeTool]);

  const handleNodeDrag = useCallback((nodeId: string, x: number, y: number) => {
    setMindMapData(prev => {
      const updatedNodes = { ...prev.nodes };
      const draggedNode = updatedNodes[nodeId];
      
      if (!draggedNode) return prev;
      
      // Update node position directly
      draggedNode.x = x;
      draggedNode.y = y;
      
      // Mark the node as manually positioned
      draggedNode.manuallyPositioned = true;
      
      // Only find potential parent for wire mode
      if (dragState.mode === 'wire') {
        console.log('Dragging in wire mode, looking for potential target nodes');
        let closestNode: MindMapNode | null = null;
        let minDistance = Infinity;
        
        Object.values(updatedNodes).forEach(node => {
          if (!node || node.id === nodeId || (dragState.wireStartNodeId && node.id === dragState.wireStartNodeId)) return;
          
          const dx = x - node.x;
          const dy = y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150 && distance < minDistance) {
            const wouldCreateCircle = node.parentIds.includes(nodeId);
            
            if (!wouldCreateCircle) {
              minDistance = distance;
              closestNode = node;
              console.log('Found potential parent:', node.id, 'Distance:', distance);
            }
          }
        });
        
        setDragState(prev => ({
          ...prev,
          potentialParentId: closestNode?.id || null
        }));
      }
      
      return { ...prev, nodes: updatedNodes };
    });
  }, [dragState.mode, dragState.wireStartNodeId]);

  const handleNodeDragEnd = useCallback(() => {
    if (!dragState.nodeId) return;
    
    if (dragState.mode === 'wire' && dragState.wireStartNodeId && dragState.potentialParentId) {
      console.log('Creating connection from', dragState.wireStartNodeId, 'to', dragState.potentialParentId);
      setMindMapData(prev => {
        const updatedNodes = { ...prev.nodes };
        const sourceNode = updatedNodes[dragState.wireStartNodeId!];
        const targetNode = updatedNodes[dragState.potentialParentId!];
        
        if (sourceNode && targetNode) {
          // Check if connection already exists
          if (!targetNode.children.includes(sourceNode.id)) {
            targetNode.children.push(sourceNode.id);
            sourceNode.parentIds.push(targetNode.id);
            setStatusMessage('Connection created');
          }
        }
        
        return { ...prev, nodes: updatedNodes };
      });
      calculateTreeLayout();
    } else if (dragState.mode === 'move') {
      setStatusMessage('Node moved');
      calculateTreeLayout();
    } else if (dragState.mode === 'wire') {
      console.log('Wire dragging ended but no valid target found');
      setStatusMessage('No connection made - drag to a target node next time');
    }
    
    // Reset drag state
    setDragState({
      nodeId: null,
      potentialParentId: null,
      offset: { x: 0, y: 0 },
      initialPosition: { x: 0, y: 0 },
      mode: null,
      wireStartNodeId: null
    });
  }, [dragState, calculateTreeLayout]);

  const handleDeleteConnection = useCallback((connectionId: string) => {
    setMindMapData(prev => {
      const connection = prev.connections.find(c => c.id === connectionId);
      if (!connection) return prev;
      
      // Remove connection from connections array
      const updatedConnections = prev.connections.filter(c => c.id !== connectionId);
      
      // Also update node relationships for backward compatibility
      const updatedNodes = { ...prev.nodes };
      const sourceNode = updatedNodes[connection.sourceId];
      const targetNode = updatedNodes[connection.targetId];
      
      if (sourceNode && targetNode) {
        // Remove child from parent's children array
        targetNode.children = targetNode.children.filter(id => id !== sourceNode.id);
        
        // Remove parent from child's parentIds array
        sourceNode.parentIds = sourceNode.parentIds.filter(id => id !== targetNode.id);
      }
      
      setStatusMessage('Connection deleted');
      return {
        ...prev,
        nodes: updatedNodes,
        connections: updatedConnections
      };
    });
  }, []);

  const addChildNode = useCallback((parentId: string) => {
    const parentNode = mindMapData.nodes[parentId];
    if (!parentNode) return;

    // Position slightly offset from parent
    const offsetX = Math.random() * 200 - 100;
    const offsetY = Math.random() * 200 - 100;

    const newNodeId = uuidv4();
    const newNode: MindMapNode = {
      id: newNodeId,
      text: 'New Topic',
      x: parentNode.x + offsetX,
      y: parentNode.y + offsetY,
      children: [],
      parentIds: [parentId],
      color: parentNode.color,
      manuallyPositioned: true // Mark as manually positioned when created
    };

    setMindMapData(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [parentId]: {
          ...prev.nodes[parentId],
          children: [...prev.nodes[parentId].children, newNodeId]
        },
        [newNodeId]: newNode
      }
    }));

    // Don't auto-layout after adding a child
    // calculateTreeLayout();
  }, [mindMapData.nodes]);

  const updateNodeText = useCallback((nodeId: string, text: string) => {
    setMindMapData(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [nodeId]: {
          ...prev.nodes[nodeId],
          text
        }
      }
    }));
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (nodeId === mindMapData.rootId) return; // Prevent deleting root node

    setMindMapData(prev => {
      const updatedNodes = { ...prev.nodes };
      const nodeToDelete = updatedNodes[nodeId];
      
      // Check if nodeToDelete exists before continuing
      if (!nodeToDelete) {
        console.warn(`Node with ID ${nodeId} not found during delete operation`);
        return prev; // Return previous state without changes
      }

      // Remove node from its parents' children arrays
      if (nodeToDelete.parentIds) {
        nodeToDelete.parentIds.forEach(parentId => {
          const parent = updatedNodes[parentId];
          if (parent) {
            parent.children = parent.children.filter(id => id !== nodeId);
          }
        });
      }

      // Remove node and its children recursively
      const deleteNodeAndChildren = (node: MindMapNode) => {
        if (!node.children) return; // Skip if children array is undefined
        
        node.children.forEach(childId => {
          const child = updatedNodes[childId];
          if (child) {
            deleteNodeAndChildren(child);
            delete updatedNodes[childId];
          }
        });
      };

      deleteNodeAndChildren(nodeToDelete);
      delete updatedNodes[nodeId];

      return {
        ...prev,
        nodes: updatedNodes
      };
    });

    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }

    calculateTreeLayout();
  }, [mindMapData.rootId, selectedNode, calculateTreeLayout]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.min(Math.max(0.1, prev * scaleFactor), 2));
    } else {
      setTranslateX(prev => prev - e.deltaX);
      setTranslateY(prev => prev - e.deltaY);
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - translateX, y: e.clientY - translateY });
    } else if (activeTool === 'node' && !dragState.nodeId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale - translateX;
      const y = (e.clientY - rect.top) / scale - translateY;
      
      const newNodeId = uuidv4();
      setMindMapData(prev => ({
        ...prev,
        nodes: {
          ...prev.nodes,
          [newNodeId]: {
            id: newNodeId,
            text: 'New Node',
            x,
            y,
            children: [],
            parentIds: [],
            color: isDarkMode ? '#ffffff' : '#1a1a1a',
            manuallyPositioned: true // Mark as manually positioned when created
          }
        }
      }));
      
      // Do NOT calculate tree layout after adding a new node
      // This prevents automatic repositioning
      // calculateTreeLayout();
    }
  }, [activeTool, scale, translateX, translateY, dragState.nodeId, isDarkMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && panStart) {
      setTranslateX(e.clientX - panStart.x);
      setTranslateY(e.clientY - panStart.y);
    }

    // Update mouse position for drawing temporary connections
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left - translateX) / scale,
      y: (e.clientY - rect.top - translateY) / scale
    });
  }, [isPanning, panStart, scale, translateX, translateY]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
    }
  }, [isPanning]);

  // Place the zoom functions first before they're used
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(2, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.1, prev * 0.8));
  }, []);

  const handleResetView = useCallback(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, []);

  // Then define handleKeyDown which uses these functions
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Tool shortcuts
    if (e.key === 'v') setActiveTool('select');
    if (e.key === 'n') setActiveTool('node');
    if (e.key === 'c') setActiveTool('wire');
    if (e.key === 'h') setActiveTool('pan');
    
    // Zoom shortcuts
    if (e.key === '=') handleZoomIn();
    if (e.key === '-') handleZoomOut();
    if (e.key === '0') handleResetView();
  }, [handleZoomIn, handleZoomOut, handleResetView]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Enhance the export functionality to support different formats
  const exportMindMap = useCallback((format: string = 'json') => {
    // Common message function
    const showStatus = (success: boolean, type: string) => {
      setStatusMessage(success ? `Mind map exported as ${type} successfully` : `Failed to export as ${type}`);
    };
    
    switch (format.toLowerCase()) {
      case 'json':
        // JSON export (existing functionality)
        const data = JSON.stringify(mindMapData);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mindmap.json';
        a.click();
        URL.revokeObjectURL(url);
        showStatus(true, 'JSON');
        break;
        
      case 'pdf':
        // PDF export
        try {
          // Here we would use a library like jsPDF to generate a PDF
          // This is a placeholder implementation
          console.log('PDF export functionality to be implemented');
          alert('PDF export will be available in a future update.');
          showStatus(false, 'PDF');
        } catch (error) {
          console.error('Error exporting as PDF:', error);
          showStatus(false, 'PDF');
        }
        break;
        
      case 'image':
        // Image export
        try {
          // Capture the canvas as an image
          const canvasElement = document.querySelector('.mind-map-canvas') as HTMLElement;
          if (canvasElement) {
            // Here we would use html2canvas or a similar library
            // This is a placeholder implementation
            console.log('Image export functionality to be implemented');
            alert('Image export will be available in a future update.');
          }
          showStatus(false, 'image');
        } catch (error) {
          console.error('Error exporting as image:', error);
          showStatus(false, 'image');
        }
        break;
        
      default:
        console.warn('Unknown export format:', format);
        setStatusMessage('Unknown export format');
    }
  }, [mindMapData]);
  
  const importMindMap = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            setMindMapData(data);
            setStatusMessage('Mind map imported successfully');
          } catch (error) {
            setStatusMessage('Error importing mind map');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);
  
  const showHelp = useCallback(() => {
    // Show help dialog or tooltip
    alert('Mind Map Builder Help\n\nSelect (V): Select and edit nodes\nAdd Node (N): Create new nodes\nConnect (C): Create connections between nodes\nPan (H): Pan the canvas\n\nUse mouse wheel to zoom in/out');
    setStatusMessage('Showing help information');
  }, []);

  // Add function to update node type
  const handleNodeTypeChange = useCallback((nodeId: string, type: string) => {
    setMindMapData(prev => {
      const updatedNodes = { ...prev.nodes };
      const node = getNodeSafely(updatedNodes, nodeId);
      
      if (node) {
        node.type = type;
      }
      
      return { ...prev, nodes: updatedNodes };
    });
    
    setStatusMessage(`Node type changed to ${type}`);
  }, [getNodeSafely]);

  // Add function to create a new root node if none exists
  const createNewNode = useCallback((type: string = 'default') => {
    const newNodeId = uuidv4();
    const defaultX = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
    const defaultY = typeof window !== "undefined" ? window.innerHeight / 2 : 300;
    
    setMindMapData(prev => {
      // If this is the first node, make it the root
      const isFirstNode = Object.keys(prev.nodes).length === 0;
      
      return {
        ...prev,
        rootId: isFirstNode ? newNodeId : prev.rootId,
        nodes: {
          ...prev.nodes,
          [newNodeId]: {
            id: newNodeId,
            text: isFirstNode ? 'Central Idea' : 'New Node',
            x: defaultX,
            y: defaultY,
            children: [],
            parentIds: [],
            type,
            color: isDarkMode ? '#ffffff' : '#1a1a1a',
            manuallyPositioned: false
          }
        }
      };
    });
    
    setStatusMessage('New node created');
    setSelectedNode(newNodeId);
  }, [isDarkMode]);

  // Handle AI generation
  const handleAIGenerate = () => {
    setShowAIGenerator(true);
  };

  // Handle when AI generates a mind map
  const handleMapGenerated = (generatedMap: MindMapData) => {
    setMindMapData(generatedMap);
    setSelectedNode(generatedMap.rootId);
    setStatusMessage('Mind map generated with AI');
    
    // Center view on the new root node
    const rootNode = generatedMap.nodes[generatedMap.rootId];
    if (rootNode) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate center position
      const targetTranslateX = (viewportWidth / 2 - rootNode.x) / scale;
      const targetTranslateY = (viewportHeight / 2 - rootNode.y) / scale;
      
      // Apply translation
      setTranslateX(targetTranslateX);
      setTranslateY(targetTranslateY);
    }
  };

  // Add a new handler for formatting changes
  const handleNodeFormattingChange = useCallback((nodeId: string, formatting: TextFormatting) => {
    setMindMapData(prev => {
      const updatedNodes = { ...prev.nodes };
      const node = updatedNodes[nodeId];
      
      if (node) {
        node.formatting = formatting;
      }
      
      return { ...prev, nodes: updatedNodes };
    });
    
    setStatusMessage('Text formatting updated');
  }, []);

  // Add handler for toggling font preview
  const handleShowFontPreview = useCallback(() => {
    setShowFontPreview(true);
  }, []);

  // Update the NodeControls section to show different options in wire mode
  const handleNodeSelection = useCallback((nodeId: string) => {
    if (activeTool === 'wire') {
      console.log('Wire tool: Node clicked:', nodeId);
      
      // If no source node is selected yet, set this as the source
      if (!connectionSourceNode) {
        console.log('Setting as source node for connection');
        setConnectionSourceNode(nodeId);
        setStatusMessage(`Connection started from node "${mindMapData.nodes[nodeId]?.text.substring(0, 15)}...". Now click on a target node.`);
      } 
      // If we already have a source node, create a connection
      else if (connectionSourceNode !== nodeId) {
        console.log('Creating connection from', connectionSourceNode, 'to', nodeId);
        
        // Create the connection
        setMindMapData(prev => {
          const updatedNodes = { ...prev.nodes };
          const sourceNode = updatedNodes[connectionSourceNode];
          const targetNode = updatedNodes[nodeId];
          
          if (sourceNode && targetNode) {
            // Check if connection already exists
            if (!targetNode.children.includes(sourceNode.id)) {
              targetNode.children.push(sourceNode.id);
              sourceNode.parentIds.push(targetNode.id);
              setStatusMessage('Connection created! You can create more connections or switch tools.');
            } else {
              setStatusMessage('Connection already exists!');
            }
          }
          
          return { ...prev, nodes: updatedNodes };
        });
        
        // Reset source node to allow another connection
        setConnectionSourceNode(null);
        calculateTreeLayout();
      } else {
        // Clicked the same node twice, cancel the connection
        setConnectionSourceNode(null);
        setStatusMessage('Connection cancelled. Click on a node to start again.');
      }
      
      setSelectedNode(nodeId);
      return; // Don't proceed with normal selection in wire mode
    }
    
    // Normal selection behavior for other tools
    setSelectedNode(nodeId);
  }, [activeTool, connectionSourceNode, mindMapData.nodes, calculateTreeLayout]);

  // Add a useEffect to reset the connection state when the tool changes
  useEffect(() => {
    if (activeTool !== 'wire') {
      setConnectionSourceNode(null);
    }
  }, [activeTool]);

  // Handle connection point clicks
  const handleConnectionPointClick = useCallback((connectionPoint: ConnectionPoint) => {
    console.log('Connection point clicked:', connectionPoint);
    
    // If we don't have a source point yet, set this as the source
    if (!pendingConnectionSource) {
      setPendingConnectionSource(connectionPoint);
      setIsConnecting(true);
      setStatusMessage(`Connection started from ${connectionPoint.position} of node. Click on another connection point to complete.`);
      return;
    }
    
    // If we click on the same point, cancel the connection
    if (pendingConnectionSource.nodeId === connectionPoint.nodeId && 
        pendingConnectionSource.position === connectionPoint.position) {
      setPendingConnectionSource(null);
      setActiveConnectionPoint(null);
      setIsConnecting(false);
      setStatusMessage('Connection cancelled.');
      return;
    }
    
    // If we already have a source, create the connection to this target
    console.log('Creating connection from', pendingConnectionSource, 'to', connectionPoint);
    
    // Create the connection
    setMindMapData(prev => {
      // Check if connection already exists
      const connectionExists = prev.connections.some(conn => 
        (conn.sourceId === pendingConnectionSource!.nodeId && 
         conn.targetId === connectionPoint.nodeId && 
         conn.sourcePoint === pendingConnectionSource!.position && 
         conn.targetPoint === connectionPoint.position) ||
        (conn.sourceId === connectionPoint.nodeId && 
         conn.targetId === pendingConnectionSource!.nodeId && 
         conn.sourcePoint === connectionPoint.position && 
         conn.targetPoint === pendingConnectionSource!.position)
      );
      
      if (connectionExists) {
        setStatusMessage('Connection already exists!');
        return prev;
      }
      
      // Create new connection
      const newConnection: NodeConnection = {
        id: uuidv4(),
        sourceId: pendingConnectionSource!.nodeId,
        targetId: connectionPoint.nodeId,
        sourcePoint: pendingConnectionSource!.position,
        targetPoint: connectionPoint.position
      };
      
      // Also update node children/parents for backward compatibility
      const updatedNodes = { ...prev.nodes };
      
      // Add child to parent's children array
      if (!updatedNodes[connectionPoint.nodeId].children.includes(pendingConnectionSource!.nodeId)) {
        updatedNodes[connectionPoint.nodeId].children.push(pendingConnectionSource!.nodeId);
      }
      
      // Add parent to child's parentIds array
      if (!updatedNodes[pendingConnectionSource!.nodeId].parentIds.includes(connectionPoint.nodeId)) {
        updatedNodes[pendingConnectionSource!.nodeId].parentIds.push(connectionPoint.nodeId);
      }
      
      setStatusMessage('Connection created!');
      
      return {
        ...prev,
        nodes: updatedNodes,
        connections: [...prev.connections, newConnection]
      };
    });
    
    // Reset connection state
    setPendingConnectionSource(null);
    setActiveConnectionPoint(null);
    setIsConnecting(false);
    calculateTreeLayout();
  }, [pendingConnectionSource, calculateTreeLayout]);

  // Reset connection state when tool changes
  useEffect(() => {
    setActiveConnectionPoint(null);
    setPendingConnectionSource(null);
    setIsConnecting(false);
  }, [activeTool]);

  return (
    <MindMapContainer isDarkMode={isDarkMode}>
      <Toolbar 
        activeTool={activeTool}
        onToolChange={setActiveTool}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onExport={exportMindMap}
        onImport={importMindMap}
        onHelp={showHelp}
        onCreateNode={createNewNode}
        onAIGenerate={handleAIGenerate}
        onShowFontPreview={handleShowFontPreview}
      />
      
      <CanvasContainer
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <GridBackground isDarkMode={isDarkMode} />
        <Canvas
          className="mind-map-canvas"
          scale={scale}
          translateX={translateX}
          translateY={translateY}
        >
          {Object.keys(mindMapData.nodes).length === 0 ? (
            <EmptyStateMessage isDarkMode={isDarkMode}>
              <EmptyStateContent>
                <h2>Welcome to Mind Map Builder!</h2>
                <p>Start building your ideas visually with our intuitive mind mapping tool. Add nodes, connect concepts, and organize your thoughts.</p>
                <EmptyStateButton 
                  isDarkMode={isDarkMode}
                  onClick={() => createNewNode('keyPoint')}
                >
                  Create First Node
                </EmptyStateButton>
              </EmptyStateContent>
            </EmptyStateMessage>
          ) : (
            <>
              <Connections 
                nodes={mindMapData.nodes}
                connections={mindMapData.connections}
                dragState={{
                  ...dragState,
                  activeConnectionPoint,
                  pendingConnectionSource
                }}
                scale={scale}
                onDeleteConnection={handleDeleteConnection}
                isDarkMode={isDarkMode}
                mousePosition={mousePosition}
              />
              
              {Object.values(mindMapData.nodes).map(node => (
                <Node 
                  key={node.id}
                  node={node}
                  isSelected={selectedNode === node.id}
                  isPotentialParent={connectionSourceNode ? (node.id !== connectionSourceNode) : dragState.potentialParentId === node.id}
                  isConnectionSource={connectionSourceNode === node.id}
                  onClick={() => handleNodeSelection(node.id)}
                  onAddChild={() => addChildNode(node.id)}
                  onTextChange={(text) => updateNodeText(node.id, text)}
                  onDelete={() => handleDeleteNode(node.id)}
                  onDragStart={(nodeId, offset, initialPosition) => handleNodeDragStart(nodeId, offset, initialPosition)}
                  onDrag={(nodeId, x, y) => handleNodeDrag(nodeId, x, y)}
                  onDragEnd={handleNodeDragEnd}
                  onTypeChange={(nodeId, type) => handleNodeTypeChange(nodeId, type)}
                  onFormattingChange={handleNodeFormattingChange}
                  scale={scale}
                  translateX={translateX}
                  translateY={translateY}
                  isDarkMode={isDarkMode}
                  isWireMode={activeTool === 'wire'}
                  onConnectionPointClick={handleConnectionPointClick}
                  activeConnectionPoint={activeConnectionPoint}
                  pendingConnectionSource={pendingConnectionSource}
                  isConnecting={isConnecting}
                />
              ))}
            </>
          )}
        </Canvas>
      </CanvasContainer>
      
      <ViewControls isDarkMode={isDarkMode}>
        <ViewButton isDarkMode={isDarkMode} onClick={handleZoomIn}>
          <Icon icon={BiZoomIn} />
        </ViewButton>
        <ZoomText isDarkMode={isDarkMode}>{Math.round(scale * 100)}%</ZoomText>
        <ViewButton isDarkMode={isDarkMode} onClick={handleZoomOut}>
          <Icon icon={BiZoomOut} />
        </ViewButton>
        <ViewButton isDarkMode={isDarkMode} onClick={handleResetView}>
          <Icon icon={BiReset} />
        </ViewButton>
      </ViewControls>
      
      <StatusBar isDarkMode={isDarkMode}>
        <StatusItem>
          {isConnecting
            ? `Click on another connection point to connect, or click the same point to cancel.`
            : statusMessage}
        </StatusItem>
        <StatusItem>
          Nodes: {nodeCount}
        </StatusItem>
        <StatusItem>
          Zoom: {Math.round(scale * 100)}%
        </StatusItem>
        <StatusItem>
          Tool: {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
        </StatusItem>
      </StatusBar>
      
      {/* AI Mind Map Generator Modal */}
      {showAIGenerator && (
        <AIMindMapGenerator
          onMapGenerated={handleMapGenerated}
          onClose={() => setShowAIGenerator(false)}
          isDarkMode={isDarkMode}
        />
      )}
      
      {/* Font Preview Modal */}
      {showFontPreview && (
        <FontPreview
          onClose={() => setShowFontPreview(false)}
          isDarkMode={isDarkMode}
        />
      )}
    </MindMapContainer>
  );
};

export default MindMap; 

const EmptyStateMessage = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 40px;
  border-radius: 16px;
  background: ${props => props.isDarkMode 
    ? 'rgba(26, 32, 58, 0.75)' 
    : 'rgba(255, 255, 255, 0.75)'};
  backdrop-filter: blur(10px);
  box-shadow: ${props => props.isDarkMode
    ? '0 10px 40px rgba(0, 0, 0, 0.25), 0 2px 10px rgba(0, 0, 0, 0.2)'
    : '0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.05)'};
  text-align: center;
  max-width: 500px;
  z-index: 5;
  animation: fadeIn 0.5s ease-out;
  border: 1px solid ${props => props.isDarkMode 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.05)'};
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -48%); }
    to { opacity: 1; transform: translate(-50%, -50%); }
  }
`;

const EmptyStateContent = styled.div`
  h2 {
    margin-top: 0;
    margin-bottom: 16px;
    font-family: 'Virgil', sans-serif;
    font-size: 28px;
    font-weight: 500;
    
    &:after {
      content: '';
      display: block;
      width: 50px;
      height: 3px;
      background: linear-gradient(90deg, #4285f4, #34a853);
      border-radius: 3px;
      margin: 12px auto 0;
    }
  }
  
  p {
    margin-bottom: 24px;
    font-size: 16px;
    line-height: 1.6;
    opacity: 0.8;
  }
`;

const EmptyStateButton = styled.button<{ isDarkMode: boolean }>`
  background: ${props => props.isDarkMode 
    ? 'linear-gradient(90deg, #4285f4, #34a853)' 
    : 'linear-gradient(90deg, #4285f4, #34a853)'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 16px;
  font-family: 'Virgil', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`; 