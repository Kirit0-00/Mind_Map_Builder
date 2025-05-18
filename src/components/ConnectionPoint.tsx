import React, { ComponentType } from 'react';
import styled from 'styled-components';
import { FiCircle } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons/lib';

const ConnectorPoint = styled.div<{ 
  position: string; 
  isActive: boolean; 
  isDarkMode: boolean;
  isConnecting: boolean;
}>`
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => 
    props.isActive 
      ? (props.isDarkMode ? '#6e9eff' : '#4285f4') 
      : (props.isDarkMode ? '#444' : '#ddd')};
  border: 2px solid ${props => 
    props.isActive 
      ? (props.isDarkMode ? '#6e9eff' : '#4285f4') 
      : (props.isDarkMode ? '#666' : '#bbb')};
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
  opacity: ${props => props.isConnecting ? 1 : 0.4};
  
  ${props => {
    switch (props.position) {
      case 'top':
        return 'top: -6px; left: 50%; transform: translateX(-50%);';
      case 'right':
        return 'top: 50%; right: -6px; transform: translateY(-50%);';
      case 'bottom':
        return 'bottom: -6px; left: 50%; transform: translateX(-50%);';
      case 'left':
        return 'top: 50%; left: -6px; transform: translateY(-50%);';
      default:
        return '';
    }
  }}
  
  &:hover {
    opacity: 1;
    transform: ${props => {
      switch (props.position) {
        case 'top':
          return 'translateX(-50%) scale(1.2)';
        case 'right':
          return 'translateY(-50%) scale(1.2)';
        case 'bottom':
          return 'translateX(-50%) scale(1.2)';
        case 'left':
          return 'translateY(-50%) scale(1.2)';
        default:
          return 'scale(1.2)';
      }
    }};
    box-shadow: 0 0 0 2px ${props => 
      props.isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
  }
  
  &:before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    top: -6px;
    left: -6px;
    border-radius: 50%;
    background: transparent;
    z-index: -1;
  }
`;

const PointIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface ConnectionPointProps {
  position: 'top' | 'right' | 'bottom' | 'left';
  isActive: boolean;
  isDarkMode: boolean;
  isConnecting: boolean;
  onClick: () => void;
  nodeId: string;
}

const ConnectionPoint: React.FC<ConnectionPointProps> = ({
  position,
  isActive,
  isDarkMode,
  isConnecting,
  onClick,
  nodeId
}) => {
  // Cast the icon component to a valid component type
  const CircleIcon = FiCircle as ComponentType<IconBaseProps>;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };
  
  const getTooltip = () => {
    if (isActive) {
      return "Cancel connection";
    } else if (isConnecting) {
      return "Connect here";
    } else {
      return "Start connection";
    }
  };
  
  return (
    <ConnectorPoint
      position={position}
      isActive={isActive}
      isDarkMode={isDarkMode}
      isConnecting={isConnecting}
      onClick={handleClick}
      title={getTooltip()}
      data-nodeid={nodeId}
      data-position={position}
    >
      <PointIcon>
        <CircleIcon size={6} />
      </PointIcon>
    </ConnectorPoint>
  );
};

export default ConnectionPoint; 