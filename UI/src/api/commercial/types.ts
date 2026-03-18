export interface CommercialRegistration {
    id: number;
    commercialId: number;
    immatriculation: string;
    prospectNom: string;
    prospectTelephone: string;
    prospectEmail?: string | null;
    prospectQuartier?: string | null;
    vehicleBrand?: string | null;
    vehicleModele?: string | null;
    vehicleColor?: string | null;
    vehicleType?: string | null;
    vehicleId: number | null;
    stationId: number;
    date: string;
    confirmed: boolean;
    couponId: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface RegisterVehicleDto {
    immatriculation: string;
    prospectNom: string;
    prospectTelephone: string;
    prospectEmail?: string;
    prospectQuartier?: string;
    vehicleBrand?: string;
    vehicleModele?: string;
    vehicleColor?: string;
    vehicleType?: string;
}

export interface CommercialStats {
    todayTotal: number;
    todayConfirmed: number;
    allTimeTotal: number;
    allTimeConfirmed: number;
    dailyGoal: number;
}

export interface PortfolioClient {
    id: number;
    nom: string;
    contact?: string;
    email?: string;
    quartier?: string;
    commercialId: number;
    pointsFidelite: number;
    vehicles: { id: number; immatriculation: string; brand?: string; modele?: string; color?: string; type?: string }[];
    createdAt: string;
}

export interface TransferPortfolioDto {
    fromCommercialId: number;
    toCommercialId: number | null;
}

export interface CommissionEntry {
    id: number;
    date: string;
    immatriculation: string;
    prospectNom: string;
    vehicleType?: string | null;
    couponId: number | null;
    couponNumero: string | null;
    montantTotal: number | null;
    services: { nom: string; commission: number }[];
    totalCommission: number;
}

export interface CommissionResult {
    entries: CommissionEntry[];
    grandTotal: number;
}

export interface AdminBonusSummary {
    commercialCommissions: { id: number; nom: string; prenom: string; total: number; count: number }[];
    totalCommissions: number;
    washerFrais: { id: number; nom: string; prenom: string; totalFrais: number; vehiculesLaves: number }[];
    totalFraisService: number;
}
