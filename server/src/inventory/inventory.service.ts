import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, Transaction, literal } from 'sequelize';
import { Produit } from './models/produit.model.js';
import { MouvementStock } from './models/mouvement-stock.model.js';
import { Fournisseur } from './models/fournisseur.model.js';
import { CommandeAchat } from './models/commande-achat.model.js';
import { User } from '../users/models/user.model.js';
import { Paiement } from '../billing/models/paiement.model.js';
import { CreateProduitDto } from './dto/create-produit.dto.js';
import { UpdateProduitDto } from './dto/update-produit.dto.js';
import { CreateMouvementStockDto } from './dto/create-mouvement-stock.dto.js';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto.js';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto.js';
import { CreateCommandeAchatDto } from './dto/create-commande-achat.dto.js';
import { UpdateCommandeAchatDto } from './dto/update-commande-achat.dto.js';
import { MouvementType, TransactionType, PaymentMethod } from '../common/constants/status.enum.js';

@Injectable()
export class InventoryService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(Produit)
    private readonly produitModel: typeof Produit,
    @InjectModel(MouvementStock)
    private readonly mouvementStockModel: typeof MouvementStock,
    @InjectModel(Fournisseur)
    private readonly fournisseurModel: typeof Fournisseur,
    @InjectModel(CommandeAchat)
    private readonly commandeAchatModel: typeof CommandeAchat,
    @InjectModel(Paiement)
    private readonly paiementModel: typeof Paiement,
  ) {}

  // ─── Produits ───────────────────────────────────────────────────────

  async findAllProduits(query: {
    stationId?: number;
    categorie?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (query.stationId) {
      where.stationId = query.stationId;
    }

    if (query.categorie) {
      where.categorie = query.categorie;
    }

    if (query.lowStock) {
      where[Op.and as unknown as string] = [
        literal('"quantiteStock" <= "quantiteAlerte"'),
      ];
    }

    const { rows: data, count: total } =
      await this.produitModel.findAndCountAll({
        where,
        order: [['nom', 'ASC']],
        limit,
        offset,
        distinct: true,
      });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneProduit(id: number) {
    const produit = await this.produitModel.findByPk(id);

    if (!produit) {
      throw new NotFoundException(`Produit #${id} introuvable`);
    }

    return produit;
  }

  async createProduit(dto: CreateProduitDto) {
    return this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
      async (t) => {
      const produit = await this.produitModel.create(dto as any, { transaction: t });

      const initialQty = dto.quantiteStock ?? 0;
      const prixRevient = dto.prixRevient ?? 0;
      if (initialQty > 0 && prixRevient > 0) {
        await this.paiementModel.create({
          methode: PaymentMethod.Cash,
          montant: initialQty * prixRevient,
          type: TransactionType.Expense,
          stationId: dto.stationId,
          categorie: 'fournitures',
          description: `Stock initial — ${dto.nom} (${initialQty} ${dto.unite ?? 'u.'} × ${prixRevient} FCFA)`,
        } as any, { transaction: t });
      }

      return produit;
    });
  }

  async updateProduit(id: number, dto: UpdateProduitDto) {
    const produit = await this.findOneProduit(id);
    return produit.update(dto as any);
  }

  // ─── Mouvements de Stock ──────────────────────────────────────────

  async findAllMouvements(query: {
    produitId?: number;
    stationId?: number;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: Record<string, any> = {};
    const includeOptions: any[] = [
      { model: User, attributes: ['id', 'nom', 'prenom'] },
    ];

    if (query.produitId) {
      where.produitId = query.produitId;
      includeOptions.push({
        model: Produit,
        attributes: ['id', 'nom'],
      });
    } else if (query.stationId) {
      includeOptions.push({
        model: Produit,
        attributes: ['id', 'nom'],
        where: { stationId: query.stationId },
      });
    } else {
      includeOptions.push({
        model: Produit,
        attributes: ['id', 'nom'],
      });
    }

    const { rows: data, count: total } =
      await this.mouvementStockModel.findAndCountAll({
        where,
        include: includeOptions,
        order: [['date', 'DESC']],
        limit,
        offset,
        distinct: true,
      });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createMouvement(dto: CreateMouvementStockDto, userId: number) {
    return this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
      async (t) => {
        // Lock the row so concurrent movements on the same product are serialized
        const produit = await this.produitModel.findByPk(dto.produitId, {
          lock: Transaction.LOCK.UPDATE,
          transaction: t,
        });
        if (!produit) {
          throw new NotFoundException(`Produit #${dto.produitId} introuvable`);
        }

        if (dto.typeMouvement === MouvementType.Sortie && produit.quantiteStock < dto.quantite) {
          throw new BadRequestException(
            `Stock insuffisant pour ${produit.nom} : disponible ${produit.quantiteStock}, demandé ${dto.quantite}`,
          );
        }

        const mouvement = await this.mouvementStockModel.create(
          { ...dto, userId } as any,
          { transaction: t },
        );

        switch (dto.typeMouvement) {
          case MouvementType.Entree:
            await produit.increment('quantiteStock', { by: dto.quantite, transaction: t });
            if (produit.prixRevient > 0) {
              await this.paiementModel.create({
                methode: PaymentMethod.Cash,
                montant: dto.quantite * produit.prixRevient,
                type: TransactionType.Expense,
                stationId: produit.stationId,
                categorie: 'fournitures',
                description: `Réapprovisionnement — ${produit.nom} (${dto.quantite} ${produit.unite ?? 'u.'} × ${produit.prixRevient} FCFA)${dto.motif ? ' — ' + dto.motif : ''}`,
              } as any, { transaction: t });
            }
            break;
          case MouvementType.Sortie:
            await produit.decrement('quantiteStock', { by: dto.quantite, transaction: t });
            break;
          case MouvementType.Ajustement:
            await produit.update({ quantiteStock: dto.quantite }, { transaction: t });
            break;
        }

        return mouvement;
      },
    );
  }

  // ─── Fournisseurs ─────────────────────────────────────────────────

  async findAllFournisseurs(query: {
    stationId?: number;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (query.stationId) {
      where.stationId = query.stationId;
    }

    const { rows: data, count: total } =
      await this.fournisseurModel.findAndCountAll({
        where,
        order: [['nom', 'ASC']],
        limit,
        offset,
        distinct: true,
      });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneFournisseur(id: number) {
    const fournisseur = await this.fournisseurModel.findByPk(id);

    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur #${id} introuvable`);
    }

    return fournisseur;
  }

  async createFournisseur(dto: CreateFournisseurDto) {
    return this.fournisseurModel.create(dto as any);
  }

  async updateFournisseur(id: number, dto: UpdateFournisseurDto) {
    const fournisseur = await this.findOneFournisseur(id);
    return fournisseur.update(dto as any);
  }

  // ─── Commandes d'Achat ────────────────────────────────────────────

  async findAllCommandes(query: {
    fournisseurId?: number;
    statut?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (query.fournisseurId) {
      where.fournisseurId = query.fournisseurId;
    }

    if (query.statut) {
      where.statut = query.statut;
    }

    const { rows: data, count: total } =
      await this.commandeAchatModel.findAndCountAll({
        where,
        include: [
          { model: Fournisseur, attributes: ['id', 'nom'] },
        ],
        order: [['date', 'DESC']],
        limit,
        offset,
        distinct: true,
      });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createCommande(dto: CreateCommandeAchatDto) {
    return this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (t) => {
        const numero = await this.generateCommandeNumero(t);
        return this.commandeAchatModel.create({ ...dto, numero } as any, { transaction: t });
      },
    );
  }

  async updateCommande(id: number, dto: UpdateCommandeAchatDto) {
    const commande = await this.commandeAchatModel.findByPk(id);

    if (!commande) {
      throw new NotFoundException(`Commande #${id} introuvable`);
    }

    return commande.update(dto as any);
  }

  private async generateCommandeNumero(t: Transaction): Promise<string> {
    const lastCommande = await this.commandeAchatModel.findOne({
      order: [['numero', 'DESC']],
      attributes: ['numero'],
      lock: Transaction.LOCK.UPDATE,
      transaction: t,
    });

    let nextNumber = 1;

    if (lastCommande?.numero) {
      const match = lastCommande.numero.match(/CMD-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `CMD-${String(nextNumber).padStart(4, '0')}`;
  }
}
