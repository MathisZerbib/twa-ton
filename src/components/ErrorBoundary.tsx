import React, { ReactNode, ErrorInfo } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--bg-primary);
  color: var(--text-primary);
  text-align: center;
  gap: 16px;
`;

const ErrorIcon = styled.div`
  font-size: 3.5rem;
  color: var(--error);
  margin-bottom: 16px;
`;

const ErrorTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0;
  color: var(--text-primary);
  letter-spacing: -0.02em;
`;

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  max-width: 500px;
  margin: 0;
`;

const ErrorDetails = styled.pre`
  background: var(--bg-secondary);
  border: 1px solid var(--bg-tertiary);
  border-radius: var(--btn-radius);
  padding: 16px;
  margin: 16px 0 0;
  text-align: left;
  font-size: 0.8rem;
  overflow-x: auto;
  max-width: 100%;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const ResetButton = styled.button`
  padding: 12px 24px;
  min-height: 44px;
  margin-top: 16px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--btn-radius);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

/**
 * ErrorBoundary component to catch and display errors gracefully
 * Catches errors in child components and displays a fallback UI
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console for debugging
    console.error("ErrorBoundary caught an error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    // Optionally reload the page
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorIcon>
            <FontAwesomeIcon icon={faExclamationTriangle} />
          </ErrorIcon>
          <ErrorTitle>Oops, something unexpected happened</ErrorTitle>
          <ErrorMessage>
            We ran into a problem. Please refresh the page and try again.
            If it keeps happening, contact support@toneats.net.
          </ErrorMessage>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <ErrorDetails>{this.state.error.toString()}</ErrorDetails>
          )}

          <ResetButton onClick={this.handleReset}>
            Go Home
          </ResetButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
