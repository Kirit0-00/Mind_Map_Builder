// A simple mock AI service for mind map generation
// In a production app, this would connect to a real AI service API

import { v4 as uuidv4 } from 'uuid';
import { MindMapData, MindMapNode } from '../types/MindMap';

// Common types of nodes that can be generated
export type NodeType = 'default' | 'keyPoint' | 'note';

// Input source types
export type InputSource = 'text' | 'url' | 'file';

// Interface for mind map generation options
export interface GenerationOptions {
  inputType: InputSource;
  content: string;
  rootNodeType?: NodeType;
  maxDepth?: number;
  maxBranches?: number;
}

// Simple helper to generate random positions around a center point
const generateRandomPosition = (centerX: number, centerY: number, level: number) => {
  const radius = level * 250; // Distance from center increases with level
  const angle = Math.random() * Math.PI * 2;
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius
  };
};

// Mock function to generate a mind map from text input
export const generateMindMapFromText = async (
  options: GenerationOptions
): Promise<MindMapData> => {
  const { content, rootNodeType = 'keyPoint', maxDepth = 3, maxBranches = 5 } = options;
  
  // Mock loading delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate a unique ID for the root node
  const rootId = uuidv4();
  
  // Default center position (would be based on viewport in real implementation)
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  // Create the root node
  const nodes: Record<string, MindMapNode> = {
    [rootId]: {
      id: rootId,
      text: content.split(' ').slice(0, 5).join(' ') + '...', // First few words as title
      x: centerX,
      y: centerY,
      children: [],
      parentIds: [],
      type: rootNodeType
    }
  };
  
  // Generate a simple structured mind map based on the input text
  // This is a simplified mock version - a real AI would do semantic analysis
  
  // Split content into sentences to create first-level branches
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const usedSentences = sentences.slice(0, maxBranches);
  
  // Create first level nodes from sentences
  for (let i = 0; i < usedSentences.length; i++) {
    const sentence = usedSentences[i].trim();
    if (sentence.length > 5) {
      const nodeId = uuidv4();
      const position = generateRandomPosition(centerX, centerY, 1);
      
      nodes[nodeId] = {
        id: nodeId,
        text: sentence.slice(0, 50) + (sentence.length > 50 ? '...' : ''),
        x: position.x,
        y: position.y,
        children: [],
        parentIds: [rootId],
        type: i % 3 === 0 ? 'keyPoint' : i % 3 === 1 ? 'note' : 'default'
      };
      
      // Add this node as a child to the root
      nodes[rootId].children.push(nodeId);
      
      // Create second level nodes (randomly, for variety)
      if (maxDepth >= 2 && sentence.length > 15) {
        const words = sentence.split(' ').filter(w => w.length > 3);
        const numSecondLevel = Math.min(Math.floor(Math.random() * 4) + 1, words.length, 4);
        
        for (let j = 0; j < numSecondLevel; j++) {
          const secondNodeId = uuidv4();
          const secondPosition = generateRandomPosition(position.x, position.y, 1);
          
          // Create text from a few sequential words
          const startIndex = Math.floor(Math.random() * (words.length - 3));
          const secondText = words.slice(startIndex, startIndex + 3).join(' ');
          
          nodes[secondNodeId] = {
            id: secondNodeId,
            text: secondText,
            x: secondPosition.x,
            y: secondPosition.y,
            children: [],
            parentIds: [nodeId],
            type: j % 3 === 0 ? 'keyPoint' : j % 3 === 1 ? 'note' : 'default'
          };
          
          // Add this node as a child to the first level node
          nodes[nodeId].children.push(secondNodeId);
        }
      }
    }
  }
  
  return {
    rootId,
    nodes,
    connections: []
  };
};

// Mock function to generate a mind map from a URL or website
export const generateMindMapFromUrl = async (
  options: GenerationOptions
): Promise<MindMapData> => {
  // For this mock, we'll just pretend we fetched content from the URL
  // and then process it the same way as text
  return generateMindMapFromText({
    ...options,
    content: `Content extracted from ${options.content}. 
    This is a mock implementation that would normally fetch the URL content.
    First key point from the website. This would contain actual extracted content.
    Second important concept from the webpage. More details would be here.
    Third section from the article that's relevant to your mind map.
    The webpage might have a conclusion or summary section that would appear here.`
  });
};

// Aggregate function that handles different input types
export const generateMindMap = async (
  options: GenerationOptions
): Promise<MindMapData> => {
  switch (options.inputType) {
    case 'url':
      return generateMindMapFromUrl(options);
    case 'file':
      // In a real implementation, this would handle file uploads
      // For now, we'll just convert it to a text-based generation
      return generateMindMapFromText({
        ...options,
        content: `Content extracted from uploaded file. 
        This is a mock implementation that would normally parse the file.
        The file would contain sections that would be converted to mind map branches.
        Different parts of the document would become different nodes.
        Images or charts might be extracted as special nodes.`
      });
    case 'text':
    default:
      return generateMindMapFromText(options);
  }
}; 