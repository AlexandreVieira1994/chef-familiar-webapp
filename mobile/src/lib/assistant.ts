import { AssistantActionProposal } from '@/lib/types';

export function buildAssistantProposal<TPayload>(
  proposal: Omit<AssistantActionProposal<TPayload>, 'requiresConfirmation'>,
) {
  return {
    ...proposal,
    requiresConfirmation: true as const,
  };
}
