export enum StationStatus {
  Active = 'active',
  Upcoming = 'upcoming',
  Inactive = 'inactive',
}

export enum ReservationStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Done = 'done',
  Cancelled = 'cancelled',
}

export enum FichePisteStatus {
  Open = 'open',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export enum CouponStatus {
  Pending = 'pending',
  Washing = 'washing',
  Done = 'done',
  Paid = 'paid',
}

export enum AffectationStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export enum IncidentStatus {
  Open = 'open',
  InProgress = 'in_progress',
  Resolved = 'resolved',
}

export enum IncidentSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum CommandeStatus {
  Pending = 'pending',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

export enum PaymentMethod {
  Cash = 'cash',
  Card = 'card',
  Wave = 'wave',
  OrangeMoney = 'orange_money',
  Transfer = 'transfer',
  Bond = 'bond',
}

export enum TransactionType {
  Income = 'income',
  Expense = 'expense',
}

export enum ExpenseCategory {
  Fournitures = 'fournitures',
  Maintenance = 'maintenance',
  Salaires = 'salaires',
  Transport = 'transport',
  Utilities = 'utilities',
  Divers = 'divers',
}

export enum MouvementType {
  Entree = 'entree',
  Sortie = 'sortie',
  Ajustement = 'ajustement',
}

export enum ProductCategory {
  Chimique = 'chimique',
  Equipement = 'equipement',
  Consommable = 'consommable',
}

export enum SubscriptionType {
  Mensuel = 'mensuel',
  Annuel = 'annuel',
}

export enum SanctionType {
  Avertissement = 'avertissement',
  Suspension = 'suspension',
  Renvoi = 'renvoi',
}

export enum SanctionStatus {
  Active = 'active',
  Levee = 'levee',
}
