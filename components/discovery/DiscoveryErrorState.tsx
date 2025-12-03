/**
 * Discovery Error State Component
 * Sprint S55: Discovery UI
 *
 * Shown when there's an error loading discovery data.
 */

import React from 'react';

interface DiscoveryErrorStateProps {
  error: string | Error;
  onRetry?: () => void;
  onGoBack?: () => void;
}

export function DiscoveryErrorState({ error, onRetry, onGoBack }: DiscoveryErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorType = getErrorType(errorMessage);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Icon */}
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${errorType.bgColor}`}>
        <span className="text-4xl">{errorType.icon}</span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{errorType.title}</h3>

      {/* Description */}
      <p className="text-gray-500 text-center max-w-md mb-2">{errorType.description}</p>

      {/* Error Details */}
      <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-6 max-w-md">
        <p className="text-sm text-red-700 font-mono">{errorMessage}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg max-w-md">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Troubleshooting:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {errorType.suggestions.map((suggestion, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface ErrorTypeInfo {
  icon: string;
  bgColor: string;
  title: string;
  description: string;
  suggestions: string[];
}

function getErrorType(errorMessage: string): ErrorTypeInfo {
  const lowerMessage = errorMessage.toLowerCase();

  // Network/Connection errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection')
  ) {
    return {
      icon: '🌐',
      bgColor: 'bg-orange-100',
      title: 'Connection Error',
      description: 'Unable to connect to the discovery service.',
      suggestions: [
        'Check your internet connection',
        'Verify the API server is running',
        'Try refreshing the page',
        'Contact support if the issue persists',
      ],
    };
  }

  // Authentication errors
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('auth') ||
    lowerMessage.includes('401')
  ) {
    return {
      icon: '🔒',
      bgColor: 'bg-yellow-100',
      title: 'Authentication Error',
      description: 'Your session may have expired or you lack permission.',
      suggestions: [
        'Try logging out and back in',
        'Verify your account has access to this vertical',
        'Contact your administrator for permissions',
      ],
    };
  }

  // Not found errors
  if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
    return {
      icon: '🔍',
      bgColor: 'bg-gray-100',
      title: 'Resource Not Found',
      description: 'The requested data could not be found.',
      suggestions: [
        'Verify the vertical and filters are correct',
        'The company may have been removed',
        'Try searching with different parameters',
      ],
    };
  }

  // Server errors
  if (
    lowerMessage.includes('server') ||
    lowerMessage.includes('500') ||
    lowerMessage.includes('internal')
  ) {
    return {
      icon: '🔧',
      bgColor: 'bg-red-100',
      title: 'Server Error',
      description: 'Something went wrong on our end.',
      suggestions: [
        'Wait a few moments and try again',
        'The service may be under maintenance',
        'Contact support if the issue continues',
      ],
    };
  }

  // Timeout errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return {
      icon: '⏱️',
      bgColor: 'bg-purple-100',
      title: 'Request Timeout',
      description: 'The request took too long to complete.',
      suggestions: [
        'Try again with fewer filters',
        'Reduce the page size',
        'Check your network speed',
        'Contact support if timeouts persist',
      ],
    };
  }

  // Rate limit errors
  if (lowerMessage.includes('rate') || lowerMessage.includes('limit') || lowerMessage.includes('429')) {
    return {
      icon: '🚦',
      bgColor: 'bg-amber-100',
      title: 'Rate Limited',
      description: 'Too many requests. Please wait before trying again.',
      suggestions: [
        'Wait a few minutes before retrying',
        'Reduce the frequency of requests',
        'Contact support to increase limits',
      ],
    };
  }

  // Default error
  return {
    icon: '⚠️',
    bgColor: 'bg-red-100',
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred while loading discovery data.',
    suggestions: [
      'Refresh the page and try again',
      'Clear your browser cache',
      'Check the browser console for details',
      'Contact support with the error message',
    ],
  };
}

export default DiscoveryErrorState;
