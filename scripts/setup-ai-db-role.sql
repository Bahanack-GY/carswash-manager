-- =============================================================================
-- LIS Car Wash — AI Chatbot Read-Only Database Role
-- =============================================================================
-- Run this script as the postgres superuser AFTER the application has created
-- all tables (i.e., after first boot with synchronize: true).
--
-- Usage:
--   psql -U postgres -d lis_car_wash -f setup-ai-db-role.sql
-- =============================================================================

-- 1. Create the restricted role (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ai_chatbot_user') THEN
    CREATE ROLE ai_chatbot_user WITH LOGIN PASSWORD 'ai_chatbot_password';
  END IF;
END
$$;

-- 2. Basic access
GRANT CONNECT ON DATABASE lis_car_wash TO ai_chatbot_user;
GRANT USAGE ON SCHEMA public TO ai_chatbot_user;

-- =============================================================================
-- 3. Tables WITH PII — grant SELECT on safe columns ONLY
-- =============================================================================

-- users: EXCLUDE password, email, telephone
GRANT SELECT (
  id, nom, prenom, role, actif,
  "globalAccess", "bonusParLavage", "objectifJournalier",
  "createdAt", "updatedAt"
) ON users TO ai_chatbot_user;

-- clients: EXCLUDE contact, email
GRANT SELECT (
  id, "stationId", nom, "pointsFidelite",
  "createdAt", "updatedAt"
) ON clients TO ai_chatbot_user;

-- stations: EXCLUDE contact
GRANT SELECT (
  id, nom, adresse, town, status,
  "objectifCommercialJournalier",
  "createdAt", "updatedAt"
) ON stations TO ai_chatbot_user;

-- fournisseurs: EXCLUDE contact
GRANT SELECT (
  id, "stationId", nom,
  "createdAt", "updatedAt"
) ON fournisseurs TO ai_chatbot_user;

-- paiements: EXCLUDE referenceExterne, justificatif
GRANT SELECT (
  id, "factureId", "userId", methode, montant,
  type, description, "stationId", categorie, "couponId",
  "createdAt", "updatedAt"
) ON paiements TO ai_chatbot_user;

-- commercial_registrations: EXCLUDE prospectNom, prospectTelephone
GRANT SELECT (
  id, "commercialId", immatriculation, "vehicleId",
  "stationId", date, confirmed, "couponId",
  "createdAt", "updatedAt"
) ON commercial_registrations TO ai_chatbot_user;

-- =============================================================================
-- 4. Safe tables — full SELECT (no PII columns exist)
-- =============================================================================

GRANT SELECT ON vehicles TO ai_chatbot_user;
GRANT SELECT ON subscriptions TO ai_chatbot_user;
GRANT SELECT ON affectations TO ai_chatbot_user;
GRANT SELECT ON performances TO ai_chatbot_user;
GRANT SELECT ON sanctions TO ai_chatbot_user;
GRANT SELECT ON promotions TO ai_chatbot_user;
GRANT SELECT ON reservations TO ai_chatbot_user;
GRANT SELECT ON types_lavage TO ai_chatbot_user;
GRANT SELECT ON services_speciaux TO ai_chatbot_user;
GRANT SELECT ON fiches_piste TO ai_chatbot_user;
GRANT SELECT ON fiche_extras TO ai_chatbot_user;
GRANT SELECT ON coupons TO ai_chatbot_user;
GRANT SELECT ON coupon_washers TO ai_chatbot_user;
GRANT SELECT ON factures TO ai_chatbot_user;
GRANT SELECT ON lignes_vente TO ai_chatbot_user;
GRANT SELECT ON produits TO ai_chatbot_user;
GRANT SELECT ON commandes_achat TO ai_chatbot_user;
GRANT SELECT ON mouvements_stock TO ai_chatbot_user;
GRANT SELECT ON incidents TO ai_chatbot_user;
GRANT SELECT ON bons_lavage TO ai_chatbot_user;
GRANT SELECT ON marketing_promotions TO ai_chatbot_user;
GRANT SELECT ON promotion_wash_types TO ai_chatbot_user;

-- =============================================================================
-- 5. DENIED tables — NO GRANT (audit_logs, campaigns, campaign_recipients, sms_templates)
--    By not granting anything, access is implicitly denied.
-- =============================================================================

-- =============================================================================
-- 6. Prevent any future tables from being accessible by default
-- =============================================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON TABLES FROM ai_chatbot_user;

-- =============================================================================
-- Done. The ai_chatbot_user can ONLY run SELECT on the tables/columns above.
-- =============================================================================
