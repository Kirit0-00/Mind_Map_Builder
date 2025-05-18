export interface Position {
  x: number;
  y: number;
}

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: number;
  fontFamily?: string;
  lineAlignments?: { [lineIndex: number]: 'left' | 'center' | 'right' | 'justify' };
}

export type ConnectionPointPosition = 'top' | 'right' | 'bottom' | 'left';

export interface ConnectionPoint {
  nodeId: string;
  position: ConnectionPointPosition;
}

export interface NodeConnection {
  sourceId: string;
  targetId: string;
  sourcePoint: ConnectionPointPosition;
  targetPoint: ConnectionPointPosition;
  id: string;
}

export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  children: string[]; // Array of child node IDs
  parentIds: string[]; // Array of parent node IDs
  color?: string;
  manuallyPositioned?: boolean; // Flag to indicate if node has been manually positioned by user
  type?: string; // Type of node for different visual styles
  formatting?: TextFormatting;
  connections?: NodeConnection[]; // Structured connections with connection points
}

export interface MindMapData {
  nodes: { [key: string]: MindMapNode };
  rootId: string;
  connections: NodeConnection[]; // Store all connections at the top level
}

export interface DragState {
  nodeId: string | null;
  potentialParentId: string | null;
  offset: Position;
  initialPosition: Position;
  mode: 'move' | 'wire' | null;
  wireStartNodeId: string | null;
  activeConnectionPoint?: ConnectionPoint | null; // Track active connection point
  pendingConnectionSource?: ConnectionPoint | null; // Track pending connection source
} 