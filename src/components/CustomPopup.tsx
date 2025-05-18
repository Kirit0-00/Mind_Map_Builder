import React, { useState, useEffect, ComponentType } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiX, FiInfo, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons/lib';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const PopupOverlay = styled.div<{ isVisible: boolean; isDarkMode: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.isDarkMode 
    ? 'rgba(0, 0, 0, 0.7)' 
    : 'rgba(0, 0, 0, 0.4)'};
  display: ${props => props.isVisible ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(3px);
`;

const PopupContainer = styled.div<{ isDarkMode: boolean; type: string }>`
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  border-radius: 12px;
  box-shadow: ${props => props.isDarkMode 
    ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
    : '0 8px 32px rgba(0, 0, 0, 0.1)'};
  padding: 24px;
  min-width: 300px;
  max-width: 500px;
  animation: ${fadeIn} 0.25s ease-out;
  position: relative;
  border-top: 4px solid ${props => {
    switch(props.type) {
      case 'success': return '#34a853';
      case 'warning': return '#fbbc05';
      case 'error': return '#ea4335';
      default: return '#4285f4';
    }
  }};
  
  // Excalidraw-style hand-drawn effect
  &:before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 14px;
    z-index: -1;
    background: transparent;
    border: 2px solid ${props => {
      switch(props.type) {
        case 'success': return '#34a853';
        case 'warning': return '#fbbc05';
        case 'error': return '#ea4335';
        default: return '#4285f4';
      }
    }};
    opacity: 0.5;
  }
`;

const PopupHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const PopupIcon = styled.div<{ type: string }>`
  margin-right: 12px;
  color: ${props => {
    switch(props.type) {
      case 'success': return '#34a853';
      case 'warning': return '#fbbc05';
      case 'error': return '#ea4335';
      default: return '#4285f4';
    }
  }};
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const PopupTitle = styled.h3<{ isDarkMode: boolean }>`
  margin: 0;
  font-size: 18px;
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  font-weight: 600;
  font-family: 'Virgil', 'Segoe UI', sans-serif;
`;

const PopupContent = styled.div<{ isDarkMode: boolean }>`
  color: ${props => props.isDarkMode ? '#c0c0c0' : '#666666'};
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 20px;
  font-family: 'Virgil', 'Segoe UI', sans-serif;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Button = styled.button<{ isDarkMode: boolean; primary?: boolean; type: string }>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'Virgil', 'Segoe UI', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: ${props => {
    if (props.primary) {
      switch(props.type) {
        case 'success': return '#34a853';
        case 'warning': return '#fbbc05';
        case 'error': return '#ea4335';
        default: return '#4285f4';
      }
    } else {
      return props.isDarkMode ? '#3d3d3d' : '#f0f0f0';
    }
  }};
  
  color: ${props => {
    if (props.primary) {
      return '#ffffff';
    } else {
      return props.isDarkMode ? '#ffffff' : '#333333';
    }
  }};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const CloseButton = styled.button<{ isDarkMode: boolean }>`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: ${props => props.isDarkMode ? '#c0c0c0' : '#666666'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.isDarkMode ? '#3d3d3d' : '#f0f0f0'};
    color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

interface CustomPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  isDarkMode: boolean;
  autoCloseTime?: number;
}

const CustomPopup: React.FC<CustomPopupProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText,
  onConfirm,
  isDarkMode,
  autoCloseTime
}) => {
  const [isVisible, setIsVisible] = useState(isOpen);
  
  useEffect(() => {
    setIsVisible(isOpen);
    
    // Auto-close if specified
    if (isOpen && autoCloseTime) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseTime, onClose]);
  
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };
  
  const getIcon = () => {
    switch(type) {
      case 'success': {
        const CheckIcon = FiCheckCircle as ComponentType<IconBaseProps>;
        return <CheckIcon />;
      }
      case 'warning':
      case 'error': {
        const AlertIcon = FiAlertTriangle as ComponentType<IconBaseProps>;
        return <AlertIcon />;
      }
      default: {
        const InfoIcon = FiInfo as ComponentType<IconBaseProps>;
        return <InfoIcon />;
      }
    }
  };
  
  // Cast the X icon to a valid component type
  const CloseIcon = FiX as ComponentType<IconBaseProps>;
  
  return (
    <PopupOverlay isVisible={isVisible} isDarkMode={isDarkMode} onClick={onClose}>
      <PopupContainer 
        isDarkMode={isDarkMode} 
        type={type}
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <CloseButton isDarkMode={isDarkMode} onClick={onClose}>
          <CloseIcon />
        </CloseButton>
        <PopupHeader>
          <PopupIcon type={type}>
            {getIcon()}
          </PopupIcon>
          <PopupTitle isDarkMode={isDarkMode}>{title}</PopupTitle>
        </PopupHeader>
        <PopupContent isDarkMode={isDarkMode}>
          {message}
        </PopupContent>
        <ButtonContainer>
          {cancelText && (
            <Button
              isDarkMode={isDarkMode}
              type={type}
              onClick={onClose}
            >
              {cancelText}
            </Button>
          )}
          <Button
            isDarkMode={isDarkMode}
            primary
            type={type}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </ButtonContainer>
      </PopupContainer>
    </PopupOverlay>
  );
};

export default CustomPopup; 