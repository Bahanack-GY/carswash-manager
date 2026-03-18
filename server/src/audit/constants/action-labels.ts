// ─── Explicit French labels for known mutating endpoints ───────────

const EXPLICIT_LABELS: Record<string, string> = {
  // Users
  'POST /users':                        'Création employé',
  'PATCH /users/:id':                   'Modification employé',
  'POST /users/:id/assign-station':     'Affectation station',
  'POST /users/:id/transfer-station':   'Transfert station',
  'POST /users/:id/unassign-station':   'Retrait station',
  'POST /users/:id/sanctions':          'Application sanction',
  'PATCH /users/sanctions/:id/lift':    'Levée sanction',
  'POST /users/:id/promote':            'Promotion employé',

  // Clients
  'POST /clients':                      'Création client',
  'PATCH /clients/:id':                 'Modification client',
  'POST /clients/:id/vehicles':         'Ajout véhicule',
  'POST /clients/:id/subscriptions':    'Création abonnement',

  // Stations
  'POST /stations':                     'Création station',
  'PATCH /stations/:id':                'Modification station',

  // Reservations
  'POST /reservations':                 'Création réservation',
  'PATCH /reservations/:id':            'Modification réservation',

  // Wash operations
  'POST /fiches-piste':                 'Création fiche de piste',
  'POST /fiches-piste/nouveau-lavage':  'Nouveau lavage',
  'PATCH /fiches-piste/:id':            'Modification fiche de piste',
  'POST /coupons':                      'Création coupon',
  'PATCH /coupons/:id/status':          'Changement statut coupon',
  'PATCH /coupons/:id/washers':         'Assignation laveurs coupon',
  'POST /wash-types':                   'Création type de lavage',
  'PATCH /wash-types/:id':              'Modification type de lavage',
  'POST /extras':                       'Création service spécial',
  'PATCH /extras/:id':                  'Modification service spécial',

  // Billing
  'POST /factures':                     'Création facture',
  'POST /paiements':                    'Enregistrement paiement',
  'POST /caisse/transactions':          'Transaction caisse',
  'POST /caisse/upload':                'Upload justificatif dépense',

  // Incidents
  'POST /incidents':                    'Déclaration incident',
  'PATCH /incidents/:id':               'Modification incident',

  // Inventory
  'POST /produits':                     'Création produit',
  'PATCH /produits/:id':                'Modification produit',
  'POST /mouvements-stock':             'Mouvement de stock',
  'POST /fournisseurs':                 'Création fournisseur',
  'PATCH /fournisseurs/:id':            'Modification fournisseur',
  'POST /commandes-achat':              'Création commande achat',
  'PATCH /commandes-achat/:id':         'Modification commande achat',

  // Commercial
  'POST /commercial/register':          'Enregistrement véhicule (commercial)',

  // Marketing
  'POST /marketing/templates':          'Création template SMS',
  'PATCH /marketing/templates/:id':     'Modification template SMS',
  'DELETE /marketing/templates/:id':    'Suppression template SMS',
  'POST /marketing/campaigns':          'Création campagne SMS',
  'POST /marketing/campaigns/:id/send': 'Envoi campagne SMS',

  // Promotions
  'POST /marketing/promotions':             'Création promotion',
  'PATCH /marketing/promotions/:id':        'Modification promotion',
  'PATCH /marketing/promotions/:id/toggle': 'Activation/désactivation promotion',
};

// ─── Entity mapping from URL controller prefix ────────────────────

const ENTITY_MAP: Record<string, string> = {
  users:              'User',
  clients:            'Client',
  stations:           'Station',
  reservations:       'Reservation',
  'fiches-piste':     'FichePiste',
  coupons:            'Coupon',
  'wash-types':       'WashType',
  extras:             'Extra',
  factures:           'Facture',
  paiements:          'Paiement',
  caisse:             'Caisse',
  incidents:          'Incident',
  produits:           'Produit',
  'mouvements-stock': 'MouvementStock',
  fournisseurs:       'Fournisseur',
  'commandes-achat':  'CommandeAchat',
  commercial:         'Commercial',
  marketing:          'Marketing',
};

const METHOD_LABELS: Record<string, string> = {
  POST:   'Création',
  PATCH:  'Modification',
  PUT:    'Modification',
  DELETE: 'Suppression',
};

/**
 * Resolve a human-readable French label for a given HTTP method + URL.
 * Tries explicit map first, falls back to auto-generated label.
 */
export function resolveActionLabel(method: string, url: string): string {
  const path = url.replace(/^\/api/, '').split('?')[0];
  const normalized = path.replace(/\/\d+/g, '/:id');
  const key = `${method} ${normalized}`;

  if (EXPLICIT_LABELS[key]) {
    return EXPLICIT_LABELS[key];
  }

  // Fallback
  const segments = path.split('/').filter(Boolean);
  const controllerPrefix = segments[0] || 'unknown';
  const entityName = ENTITY_MAP[controllerPrefix] || controllerPrefix;
  return `${METHOD_LABELS[method] || method} ${entityName}`;
}

/**
 * Extract entity type and ID from a URL.
 */
export function resolveEntity(url: string): { entity: string; entityId: string | null } {
  const path = url.replace(/^\/api/, '').split('?')[0];
  const segments = path.split('/').filter(Boolean);

  const controllerPrefix = segments[0] || 'unknown';
  const entity = ENTITY_MAP[controllerPrefix] || controllerPrefix;

  let entityId: string | null = null;
  if (segments.length > 1 && /^\d+$/.test(segments[1])) {
    entityId = segments[1];
  }

  return { entity, entityId };
}
