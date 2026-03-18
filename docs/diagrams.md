# Diagrammes UML - Application de Gestion de Car Wash

## 1. Diagramme de Séquence : Parcours Client (avec Réservations & Notifications)

```mermaid
sequenceDiagram
    actor Client
    actor S as Système (Auto/SMS)
    actor C as Contrôleur
    actor K as Caissière
    actor L as Agent Laveur

    opt Réservation
        Client->>K: Réserve un créneau horaire
        K->>S: Enregistre la Réservation
        S-->>Client: SMS de Confirmation
    end

    Client->>C: Arrivée du véhicule
    C->>Client: Proposition services, prix, ou vérification de l'Abonnement
    Note over Client, C: Le client est conduit en salle d'attente
    C->>C: Remplissage de la Fiche de Piste (Lieu/Sinistre existant)
    C->>K: Remise de la Fiche de Piste
    K->>K: Remplissage du Coupon
    K->>C: Remise du Coupon
    C->>L: Transmission du Coupon (Affectation d'1 ou plusieurs Laveurs)
    Note over L: Les agents effectuent UNIQUEMENT<br/>les services inscrits
    L->>L: Effectuent le lavage
    Note over L, S: Enregistre la performance (Bonus par véhicule pour chaque laveur)
    S->>S: Met à jour stat. des laveurs (Calcul Bonus)
    L->>C: Retour du Coupon (Lavage terminé)
    C->>C: Vérification de la qualité
    Note over C, Client: Gestion d'Incident si plainte
    C->>S: Déclenche Notification de Fin
    S-->>Client: SMS "Véhicule prêt"
    Client->>K: Présentation du Coupon en caisse
    Note over Client, K: Achat Boutique (Boissons, Accessoires...)
    Client->>K: Paiement (Espèces, Mobile Money, CB)
    K->>K: Génération Facture & Enregistrement Transaction
    K->>K: Mise à jour CRM & Stocks Boutique
```

## 2. Diagramme de Cas d'Utilisation

```mermaid
flowchart LR
    Client([Client])
    Controleur([Contrôleur])
    Caissiere([Caissière])
    Laveur([Agent Laveur])
    Manager([Manager])
    Proprietaire([Propriétaire / Super Admin])

    subgraph "Application Car Wash"
        UC1(Gérer Fiches de Piste & Incidents)
        UC2(Éditer Coupons & Factures)
        UC3(Gérer Réservations)
        UC4(Valider Qualité & Envoyer SMS)
        UC5(Vendre Articles Boutique & Encaisser)
        UC6(Gérer Fournisseurs & Commandes)
        UC7(Voir Statistiques Ventes & Performances)
        UC8(Gérer Stocks Lavage & Boutique)
        UC9(Gérer CRM : Abonnements, Bons)
        UC10(Créer / Gérer Stations)
        UC11(Calculer Bonus & Affecter Employés)
    end

    Client --- UC3
    Client --- UC5
    Client --- UC9

    Controleur --- UC1
    Controleur --- UC4
    Controleur --- UC8

    Caissiere --- UC2
    Caissiere --- UC3
    Caissiere --- UC5
    Caissiere --- UC6
    Caissiere --- UC9

    Laveur --- UC3

    Manager --- UC6
    Manager --- UC7
    Manager --- UC8
    Manager --- UC9
    Manager --- UC11

    Proprietaire --- UC7
    Proprietaire --- UC10
    Proprietaire --- UC11
```

## 3. Diagramme de Classes (Complet)

```mermaid
classDiagram
    class StationLavage {
        +UUID id
        +String nom
        +String adresse
        +String town
        +String contact
    }

    class Utilisateur {
        +UUID id
        +String nom
        +String prenom
        +String email
        +String telephone
        +String password
        +String role (Manager, Controleur, Caissiere, Laveur)
        +Boolean actif
    }
    
    class AffectationEmploye {
        +UUID id
        +DateTime dateDebut
        +DateTime dateFin
        +String statut
    }

    class PerformanceLaveur {
        +UUID id
        +DateTime date
        +Int vehiculesLaves
        +Float bonusEstime
    }
    
    class Client {
        +UUID id
        +String nom
        +String contact
        +Int pointsFidelite
    }
    
    class Vehicule {
        +String immatriculation
        +String modele
        +String color 
        +String type
        +String brand
    }

    class Abonnement {
        +UUID id
        +String type (Mensuel, Annuel)
        +DateTime dateDebut
        +DateTime dateFin
        +Boolean actif
    }
    
    class Reservation {
        +UUID id
        +DateTime dateHeureApport
        +String statut (EnAttente, Confirme, Annule)
        +String type
    }

    class Facture {
        +String numero
        +Float montantTotal
        +Float tva
        +DateTime date
    }

    class Paiement {
        +UUID id
        +String methode (Especes, MobileMoney, CB, Abonnement)
        +Float montant
        +String referenceExterne
    }
    
    class Incident {
        +UUID id
        +String description
        +String statut (Ouvert, Resolu)
        +DateTime dateDeclaration
    }

    class Fournisseur {
        +UUID id
        +String nom
        +String contact
    }

    class CommandeAchat {
        +String numero
        +DateTime date
        +String statut (Brouillon, Envoyee, Recue)
    }
    
    class Produit {
        +UUID id
        +String nom
        +String categorie (Entretien, Boutique, Ustensile)
        +Int quantiteStock
        +Int quantiteAlerte
    }

    class MouvementStock {
        +UUID id
        +DateTime date
        +String typeMouvement (Entree, Sortie, Perime, Termine, Casse)
        +Int quantite
        +String motif
    }

    class LigneVenteBoutique {
        +UUID id
        +Int quantite
        +Float prixUnitaire
        +Float sousTotal
    }
    
    class FichePiste {
        +UUID id
        +DateTime date
        +String etatLieu
    }
    
    class TypeLavage {
        +UUID id
        +String nom
        +String particularites
        +Float prixBase
    }
    
    class ServiceAdditionnel {
        +UUID id
        +String nom
        +Float prix
    }
    
    class Coupon {
        +String numero
        +String statut
    }

    LigneVenteBoutique "*" -- "1" Produit : Vente
    MouvementStock "*" -- "1" Produit : trace
    MouvementStock "*" -- "1" Utilisateur : declare
    
    StationLavage "1" -- "*" FichePiste : traite
    StationLavage "1" -- "*" Produit : stocke
    StationLavage "1" -- "*" Fournisseur : travaille avec
    Fournisseur "1" -- "*" CommandeAchat : recoit
    StationLavage "1" -- "*" Incident : enregistre
    
    Client "1" -- "*" Vehicule : possede
    Client "1" -- "*" Abonnement : souscrit
    Client "1" -- "*" Reservation : effectue
    Client "1" -- "*" Incident : declare
    
    Vehicule "1" -- "*" FichePiste : concerne
    Vehicule "1" -- "*" Reservation : pour
    
    FichePiste "1" -- "1" Coupon : genere
    FichePiste "1" -- "1" TypeLavage : determine le lavage principal
    FichePiste "*" -- "*" ServiceAdditionnel : inclut (options)
    
    Coupon "1" -- "1" Facture : est lie a
    Facture "1" -- "*" Paiement : regle par
    Facture "1" -- "*" LigneVenteBoutique : contient (Achats)
    LigneVenteBoutique "*" -- "1" Produit : de type Boutique
    
    Utilisateur "1" -- "*" AffectationEmploye : a
    StationLavage "1" -- "*" AffectationEmploye : emploie
    
    Utilisateur "1" -- "*" PerformanceLaveur : cumule (Laveur)
    Coupon "*" -- "*" Utilisateur : laves par (1 ou + Laveurs)
```
