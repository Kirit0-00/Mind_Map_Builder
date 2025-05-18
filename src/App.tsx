import React from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import MindMap from './components/MindMap';
import { theme } from './theme';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background: ${props => props.theme.background};
    color: ${props => props.theme.text};
  }

  * {
    box-sizing: border-box;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.background};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.textSecondary};
  }
`;

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: ${props => props.theme.background};
  display: flex;
  flex-direction: column;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.surface};
  border-bottom: 1px solid ${props => props.theme.border};
  gap: ${props => props.theme.spacing.md};
`;

const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  &:not(:last-child) {
    padding-right: ${props => props.theme.spacing.md};
    border-right: 1px solid ${props => props.theme.border};
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme.text};
`;

function App() {
  // Use the dark theme by default
  const currentTheme = theme.dark;

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      <AppContainer>
        <Toolbar>
          <ToolbarGroup>
            <Title>Mind Map Builder</Title>
          </ToolbarGroup>
        </Toolbar>
        <MindMap />
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
