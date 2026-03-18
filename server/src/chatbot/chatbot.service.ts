import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PromptService } from './services/prompt.service.js';
import { OllamaService } from './services/ollama.service.js';
import { QuerySandboxService } from './services/query-sandbox.service.js';
import type { ChatbotResponse } from './interfaces/chatbot-response.interface.js';

/**
 * camelCase column names that PostgreSQL stores with mixed case.
 * If the model writes them unquoted, PG lowercases them and fails.
 * We auto-fix this by wrapping them in double quotes.
 */
const CAMEL_COLUMNS = [
  'stationId', 'clientId', 'userId', 'vehicleId', 'controleurId',
  'typeLavageId', 'fichePisteId', 'couponId', 'factureId', 'produitId',
  'fournisseurId', 'commercialId', 'declarantId', 'createdById',
  'serviceSpecialId', 'promotionId', 'templateId',
  'pointsFidelite', 'montantTotal', 'prixBase', 'prixUnitaire', 'sousTotal',
  'typeMouvement', 'quantiteStock', 'quantiteAlerte',
  'bonusParLavage', 'objectifJournalier', 'objectifCommercialJournalier',
  'globalAccess', 'dateDebut', 'dateFin', 'dateHeureApport', 'dateDeclaration',
  'stopsActivity', 'resolvedAt', 'etatLieu',
  'isUsed', 'usedAt', 'isActive',
  'ancienRole', 'nouveauRole', 'noteLevee',
  'discountType', 'discountValue', 'minVisits', 'maxUses', 'usedCount',
  'startDate', 'endDate',
  'dureeEstimee', 'particularites',
  'referenceExterne', 'bonusEstime', 'vehiculesLaves',
  'totalRecipients', 'sentCount', 'failedCount',
  'createdAt', 'updatedAt', 'createdBy',
];

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private static readonly MAX_RETRIES = 2;

  /** Precompiled regex for auto-quoting camelCase columns */
  private readonly camelQuoteRegex: RegExp;

  constructor(
    private readonly promptService: PromptService,
    private readonly ollamaService: OllamaService,
    private readonly querySandbox: QuerySandboxService,
    @Inject('CHATBOT_DB_POOL') private readonly readOnlyPool: Pool,
  ) {
    // Match unquoted camelCase columns: word boundary + column name + NOT already in quotes
    // Uses negative lookbehind for " and negative lookahead for "
    const pattern = CAMEL_COLUMNS
      .sort((a, b) => b.length - a.length) // longest first to avoid partial matches
      .join('|');
    this.camelQuoteRegex = new RegExp(
      `(?<!")\\b(${pattern})\\b(?!")`,
      'g',
    );
  }

  async query(question: string, stationId?: number): Promise<ChatbotResponse> {
    let lastError: string | null = null;
    let lastFailedSql: string | null = null;

    for (
      let attempt = 0;
      attempt <= ChatbotService.MAX_RETRIES;
      attempt++
    ) {
      const prompt = this.promptService.build(question, lastError, lastFailedSql);

      let rawSql: string;
      try {
        rawSql = await this.ollamaService.generate(prompt, attempt > 0 ? 0.5 : 0.3);
      } catch (err) {
        this.logger.error(`Ollama call failed: ${(err as Error).message}`);
        return {
          success: false,
          message:
            "Le service d'IA n'est pas disponible. Veuillez réessayer plus tard.",
        };
      }

      this.logger.debug(`Ollama raw response: ${rawSql.substring(0, 500)}`);
      let sql = this.cleanSql(rawSql);

      if (!sql || sql === 'INVALID_QUERY') {
        return {
          success: false,
          message:
            'Je ne peux pas répondre à cette question à partir de la base de données.',
        };
      }

      // Auto-quote camelCase columns the model forgot to quote
      sql = this.autoquoteCamelColumns(sql);
      this.logger.debug(`Final SQL: ${sql.substring(0, 500)}`);

      const validation = this.querySandbox.validate(sql);
      if (!validation.valid) {
        this.logger.warn(
          `Security rejection (attempt ${attempt + 1}): ${validation.reason}`,
        );
        return {
          success: false,
          message: 'Requête non autorisée.',
        };
      }

      try {
        const result = await this.readOnlyPool.query(sql);
        return {
          success: true,
          data: result.rows,
          sql,
          message: null,
        };
      } catch (dbError) {
        lastError = (dbError as Error).message;
        lastFailedSql = sql;
        this.logger.warn(
          `DB error (attempt ${attempt + 1}/${ChatbotService.MAX_RETRIES + 1}): ${lastError}`,
        );

        if (attempt === ChatbotService.MAX_RETRIES) {
          return {
            success: false,
            message:
              "Je n'ai pas pu générer une requête valide. Essayez de reformuler votre question.",
          };
        }
      }
    }

    return {
      success: false,
      message: 'Une erreur inattendue est survenue.',
    };
  }

  /**
   * Auto-wrap known camelCase column names in double quotes.
   * e.g. c.stationId -> c."stationId", WHERE pointsFidelite -> WHERE "pointsFidelite"
   */
  private autoquoteCamelColumns(sql: string): string {
    return sql.replace(this.camelQuoteRegex, '"$1"');
  }

  private cleanSql(raw: string): string {
    let sql = raw.trim();

    // Strip markdown code fences if the model wraps them
    sql = sql.replace(/^```(?:sql)?\s*/i, '').replace(/\s*```$/, '');

    // Remove any leading "SQL:" prefix the model might echo
    sql = sql.replace(/^SQL:\s*/i, '');

    // Remove trailing semicolons (we add our own in the pool query)
    sql = sql.replace(/;+$/, '');

    return sql.trim();
  }
}
