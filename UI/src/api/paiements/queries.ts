import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paiementsApi } from './api';
import type { CreatePaiementDto, TransactionFilters } from './types';

export const PAIEMENTS_KEYS = {
    all: ['paiements'] as const,
    lists: () => [...PAIEMENTS_KEYS.all, 'list'] as const,
    summary: (stationId: number, startDate?: string, endDate?: string) =>
        [...PAIEMENTS_KEYS.all, 'summary', stationId, startDate, endDate] as const,
};

export const usePaiements = (filters: TransactionFilters) => {
    return useQuery({
        queryKey: [...PAIEMENTS_KEYS.lists(), filters],
        queryFn: () => paiementsApi.getTransactions(filters),
        enabled: !!filters.stationId,
    });
};

export const useCaisseSummary = (stationId: number, startDate?: string, endDate?: string) => {
    return useQuery({
        queryKey: PAIEMENTS_KEYS.summary(stationId, startDate, endDate),
        queryFn: () => paiementsApi.getSummary(stationId, undefined, startDate, endDate),
        enabled: !!stationId,
    });
};

export const useCreatePaiement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ idempotencyKey, ...data }: CreatePaiementDto & { idempotencyKey?: string }) =>
            paiementsApi.create(data, idempotencyKey),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['factures'] });
            queryClient.invalidateQueries({ queryKey: PAIEMENTS_KEYS.all });
        },
    });
};
