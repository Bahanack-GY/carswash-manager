export type ExtraCategorie = 'lavage' | 'renovation' | 'film' | 'accessoire' | 'vitre' | 'nettoyage';
export type ExtraStatut = 'active' | 'suspended';

export interface ExtraService {
    id: number;
    stationId?: number | null;
    nom: string;
    categorie?: ExtraCategorie | null;
    particularites?: string | null;
    prix: number;
    prixCatB?: number | null;
    commission?: number | null;
    fraisService?: number | null;
    bonus?: number | null;
    dureeEstimee?: number | null;
    statut: ExtraStatut;
    createdAt: string;
    updatedAt: string;
}

export interface CreateExtraServiceDto {
    stationId?: number | null;
    nom: string;
    categorie?: ExtraCategorie;
    particularites?: string;
    prix: number;
    prixCatB?: number | null;
    commission?: number | null;
    fraisService?: number | null;
    bonus?: number | null;
    dureeEstimee?: number;
    statut?: ExtraStatut;
}

export interface UpdateExtraServiceDto extends Partial<CreateExtraServiceDto> { }

export interface ExtraFilters {
    stationId?: number;
}
