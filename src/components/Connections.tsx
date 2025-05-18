import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { MindMapNode, DragState, Position, NodeConnection, ConnectionPointPosition } from '../types/MindMap';

const ConnectionsContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
`;

const ConnectionCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto; /* Enable pointer events for deletion */
  cursor: default;
`;

const ConnectionDeleteButton = styled.div<{ x: number; y: number; isDarkMode: boolean; scale: number }>`
  position: absolute;
  width: 24px;
  height: 24px;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  left: ${props => props.x - 12 * props.scale}px;
  top: ${props => props.y - 12 * props.scale}px;
  transform: scale(${props => props.scale});
  z-index: 1000;
  opacity: 0.8;
  transition: opacity 0.2s ease, transform 0.2s ease;
  
  &:hover {
    opacity: 1;
    transform: scale(${props => props.scale * 1.2});
  }
  
  &:before, &:after {
    content: '';
    position: absolute;
    width: 12px;
    height: 2px;
    background: ${props => props.isDarkMode ? '#ff4d4d' : '#ff4d4d'};
    border-radius: 1px;
    transform-origin: center;
  }
  
  &:before {
    transform: rotate(45deg);
  }
  
  &:after {
    transform: rotate(-45deg);
  }
`;

interface ConnectionsProps {
  nodes: { [key: string]: MindMapNode };
  connections: NodeConnection[];
  dragState: DragState;
  scale: number;
  onDeleteConnection: (connectionId: string) => void;
  isDarkMode: boolean;
  mousePosition?: Position;
}

interface ConnectionInfo {
  id: string;
  midX: number;
  midY: number;
}

const Connections: React.FC<ConnectionsProps> = ({
  nodes,
  connections,
  dragState,
  scale,
  onDeleteConnection,
  isDarkMode,
  mousePosition
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredConnection, setHoveredConnection] = useState<ConnectionInfo | null>(null);
  
  // Store connection path information for hit detection
  const connectionPathsRef = useRef<Map<string, { points: Position[] }>>(new Map());

  // Get position of a connection point on a node
  const getConnectionPointPosition = useCallback((nodeId: string, pointPosition: ConnectionPointPosition): Position => {
    const node = nodes[nodeId];
    if (!node) return { x: 0, y: 0 };
    
    const nodeWidth = 200; // Approximate width, ideally this would be dynamic
    const nodeHeight = 60; // Approximate height, ideally this would be dynamic
    
    switch (pointPosition) {
      case 'top':
        return { x: node.x + nodeWidth / 2, y: node.y };
      case 'right':
        return { x: node.x + nodeWidth, y: node.y + nodeHeight / 2 };
      case 'bottom':
        return { x: node.x + nodeWidth / 2, y: node.y + nodeHeight };
      case 'left':
        return { x: node.x, y: node.y + nodeHeight / 2 };
      default:
        return { x: node.x + nodeWidth / 2, y: node.y + nodeHeight / 2 };
    }
  }, [nodes]);

  // Draw a curved path between two points
  const drawCurvedPath = useCallback((
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string,
    isDashed: boolean = false,
    roughness: number = 2,
    connectionId?: string
  ) => {
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate control points for a smooth curve
    const controlPointOffset = Math.min(distance * 0.4, 150);
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    // Calculate perpendicular offset for control points
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;
    const cpOffset = Math.min(distance * 0.2, 50);
    
    const cp1x = midX + Math.cos(perpAngle) * cpOffset;
    const cp1y = midY + Math.sin(perpAngle) * cpOffset;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isDashed) {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }

    // Collect points for hit detection if this is an existing connection
    const points: Position[] = [];
    if (connectionId) {
      points.push({ x: startX, y: startY });
    }

    // Draw main curve with slight roughness for hand-drawn effect
    const segments = 20;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = Math.pow(1-t, 3) * startX + 
                3 * Math.pow(1-t, 2) * t * (startX + controlPointOffset) +
                3 * (1-t) * Math.pow(t, 2) * cp1x +
                Math.pow(t, 3) * endX;
      const y = Math.pow(1-t, 3) * startY +
                3 * Math.pow(1-t, 2) * t * startY +
                3 * (1-t) * Math.pow(t, 2) * cp1y +
                Math.pow(t, 3) * endY;
                
      // Add slight roughness
      const rdx = (Math.random() - 0.5) * roughness;
      const rdy = (Math.random() - 0.5) * roughness;
      
      const pointX = x + rdx;
      const pointY = y + rdy;
      
      ctx.lineTo(pointX, pointY);
      
      // Store more points for more accurate hit detection
      if (connectionId && i % 2 === 0) {
        points.push({ x: pointX, y: pointY });
      }
    }
    
    ctx.stroke();
    ctx.setLineDash([]);

    // Store connection path for hit detection
    if (connectionId) {
      points.push({ x: endX, y: endY });
      connectionPathsRef.current.set(connectionId, { points });
    }

    // Draw arrow
    if (!isDashed) {
      const arrowSize = 8;
      const arrowAngle = Math.atan2(endY - cp1y, endX - cp1x);
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
      );
      ctx.stroke();
    }
    
    return { midX, midY }; // Return midpoint for potential delete button
  }, []);

  // Calculate distance from point to line segment
  const distanceToLineSegment = useCallback((x1: number, y1: number, x2: number, y2: number, x: number, y: number): number => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Check if a point is near a connection path
  const isPointNearPath = useCallback((x: number, y: number, connectionId: string): boolean => {
    const path = connectionPathsRef.current.get(connectionId);
    if (!path) return false;
    const points = path.points;
    const hitDistance = 8;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      // Distance from point to line segment
      const distance = distanceToLineSegment(p1.x, p1.y, p2.x, p2.y, x, y);
      if (distance < hitDistance) {
        return true;
      }
    }
    return false;
  }, [distanceToLineSegment]);

  // Handle mouse move to detect hovering over connections
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    // Calculate mouse position with scale and translate
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if hovering over any connection
    let found = false;
    
    for (const connection of connections) {
      if (isPointNearPath(x / scale, y / scale, connection.id)) {
        // Get the actual connection points positions
        const sourcePos = getConnectionPointPosition(connection.sourceId, connection.sourcePoint);
        const targetPos = getConnectionPointPosition(connection.targetId, connection.targetPoint);
        
        // Calculate the scaled midpoint for the delete button
        const midX = ((sourcePos.x + targetPos.x) / 2) * scale;
        const midY = ((sourcePos.y + targetPos.y) / 2) * scale;
        
        setHoveredConnection({
          id: connection.id,
          midX,
          midY
        });
        
        // Update cursor to indicate the connection is clickable
        canvas.style.cursor = 'pointer';
        found = true;
        break;
      }
    }
    
    if (!found) {
      setHoveredConnection(null);
      canvas.style.cursor = 'default';
    }
  }, [connections, scale, isPointNearPath, getConnectionPointPosition]);

  // Handle click to delete connection
  const handleDeleteClick = useCallback((connectionId: string) => {
    onDeleteConnection(connectionId);
    setHoveredConnection(null);
  }, [onDeleteConnection]);

  // Handle click on canvas - needed to prevent drag/pan when clicking on connections
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (hoveredConnection) {
      e.stopPropagation();
      handleDeleteClick(hoveredConnection.id);
    }
  }, [hoveredConnection, handleDeleteClick]);

  useEffect(() => {
    // Clear the connection paths on each render
    connectionPathsRef.current.clear();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing connections using connection points
    connections.forEach(connection => {
      const sourceNode = nodes[connection.sourceId];
      const targetNode = nodes[connection.targetId];
      
      if (!sourceNode || !targetNode) return;
      
      const sourcePos = getConnectionPointPosition(connection.sourceId, connection.sourcePoint);
      const targetPos = getConnectionPointPosition(connection.targetId, connection.targetPoint);
      
      const color = isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
      
      drawCurvedPath(
        ctx,
        sourcePos.x,
        sourcePos.y,
        targetPos.x,
        targetPos.y,
        color,
        false,
        2,
        connection.id
      );
    });

    // Draw active connection line while creating a connection
    if (dragState.pendingConnectionSource && mousePosition) {
      const sourceNodeId = dragState.pendingConnectionSource.nodeId;
      const sourceNode = nodes[sourceNodeId];
      
      if (sourceNode) {
        const sourcePos = getConnectionPointPosition(
          sourceNodeId, 
          dragState.pendingConnectionSource.position
        );
        
        // If we have an active target point, draw to that, otherwise draw to mouse
        const targetPos = dragState.activeConnectionPoint 
          ? getConnectionPointPosition(
              dragState.activeConnectionPoint.nodeId,
              dragState.activeConnectionPoint.position
            )
          : mousePosition;
        
        drawCurvedPath(
          ctx,
          sourcePos.x,
          sourcePos.y,
          targetPos.x,
          targetPos.y,
          isDarkMode ? '#6e9eff' : '#4285f4',
          true,
          3
        );
      }
    }
  }, [nodes, connections, dragState, scale, isDarkMode, mousePosition, drawCurvedPath, getConnectionPointPosition]);

  return (
    <ConnectionsContainer>
      <ConnectionCanvas 
        ref={canvasRef} 
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
      />
      {hoveredConnection && (
        <ConnectionDeleteButton 
          x={hoveredConnection.midX}
          y={hoveredConnection.midY}
          isDarkMode={isDarkMode}
          scale={scale}
          onClick={() => handleDeleteClick(hoveredConnection.id)}
          title="Delete connection"
        />
      )}
    </ConnectionsContainer>
  );
};

export default Connections;