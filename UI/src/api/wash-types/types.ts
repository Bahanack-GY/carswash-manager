export type WashTypeStatut = 'active' | 'suspended';

export interface WashType {
    id: number;
    stationId?: number | null;
    nom: string;
    particularites?: string | null;
    prixBase: number;
    prixCatB?: number | null;
    fraisService?: number | null;
    dureeEstimee?: number | null;
    statut: WashTypeStatut;
    createdAt: string;
    updatedAt: string;
}

export interface CreateWashTypeDto {
    stationId?: number | null;
    nom: string;
    particularites?: string;
    prixBase: number;
    prixCatB?: number | null;
    fraisService?: number | null;
    dureeEstimee?: number;
    statut?: WashTypeStatut;
}

export interface UpdateWashTypeDto extends Partial<CreateWashTypeDto> { }

export interface WashTypeFilters {
    stationId?: number;
}
