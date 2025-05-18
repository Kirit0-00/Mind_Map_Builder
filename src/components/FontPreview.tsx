import React from 'react';
import styled from 'styled-components';

interface FontPreviewProps {
  onClose: () => void;
  isDarkMode: boolean;
}

const PreviewContainer = styled.div<{ isDarkMode: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 24px;
  z-index: 9999;
  border: 1px solid ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h2<{ isDarkMode: boolean }>`
  margin: 0;
  font-size: 20px;
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
`;

const CloseButton = styled.button<{ isDarkMode: boolean }>`
  background: transparent;
  border: none;
  font-size: 22px;
  color: ${props => props.isDarkMode ? '#c0c0c0' : '#666666'};
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  
  &:hover {
    background: ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

const FontGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

const FontRow = styled.div<{ isDarkMode: boolean }>`
  padding: 16px;
  border-radius: 8px;
  background: ${props => props.isDarkMode ? '#202020' : '#f8f9fa'};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FontName = styled.div<{ isDarkMode: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.isDarkMode ? '#c0c0c0' : '#666666'};
  margin-bottom: 4px;
`;

const FontSample = styled.div<{ fontFamily: string; isDarkMode: boolean }>`
  font-family: ${props => props.fontFamily};
  font-size: 18px;
  line-height: 1.5;
  color: ${props => props.isDarkMode ? '#ffffff' : '#333333'};
  margin-top: 8px;
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
`;

const FontPreview: React.FC<FontPreviewProps> = ({ onClose, isDarkMode }) => {
  const fonts = [
    { name: 'Excalidraw (Virgil)', fontFamily: "'Virgil', 'Segoe UI', system-ui, -apple-system, sans-serif" },
    { name: 'Arial', fontFamily: "'Arial', sans-serif" },
    { name: 'Poppins', fontFamily: "'Poppins', sans-serif" },
    { name: 'Roboto Mono', fontFamily: "'Roboto Mono', monospace" },
    { name: 'Kalam (Handwritten)', fontFamily: "'Kalam', cursive" }
  ];

  const sampleText = "The quick brown fox jumps over the lazy dog. 1234567890";
  const mindMapSample = "This is how your mind map nodes will look with this font!";

  return (
    <>
      <Backdrop onClick={onClose} />
      <PreviewContainer isDarkMode={isDarkMode}>
        <PreviewHeader>
          <Title isDarkMode={isDarkMode}>Font Preview</Title>
          <CloseButton isDarkMode={isDarkMode} onClick={onClose}>×</CloseButton>
        </PreviewHeader>
        
        <FontGrid>
          {fonts.map((font, index) => (
            <FontRow key={index} isDarkMode={isDarkMode}>
              <FontName isDarkMode={isDarkMode}>{font.name}</FontName>
              <FontSample fontFamily={font.fontFamily} isDarkMode={isDarkMode}>
                {sampleText}
              </FontSample>
              <FontSample fontFamily={font.fontFamily} isDarkMode={isDarkMode}>
                {mindMapSample}
              </FontSample>
            </FontRow>
          ))}
        </FontGrid>
      </PreviewContainer>
    </>
  );
};

export default FontPreview; 