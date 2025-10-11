import { Plugin } from '@envelop/core';
import { RequestContextService } from '@anineplus/common';

/**
 * GraphQL Request ID Plugin
 * Adds requestId to GraphQL response extensions
 */
export function useRequestIdPlugin(
  contextService: RequestContextService,
): Plugin {
  return {
    onExecute() {
      return {
        onExecuteDone({ result, setResult }) {
          const requestId = contextService.getRequestId() || 'unknown';

          // Add requestId to extensions
          if (result && typeof result === 'object' && 'data' in result) {
            setResult({
              ...result,
              extensions: {
                ...(result.extensions || {}),
                requestId,
                timestamp: new Date().toISOString(),
              },
            });
          }
        },
      };
    },
  };
}
