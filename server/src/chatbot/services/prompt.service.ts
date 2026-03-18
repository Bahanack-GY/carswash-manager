import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchemaService } from './schema.service.js';

@Injectable()
export class PromptService implements OnModuleInit {
  private readonly logger = new Logger(PromptService.name);
  private compiledSchema = '';
  /** table name -> list of column names (for enriching error messages) */
  private tableColumns = new Map<string, string[]>();

  constructor(private readonly schemaService: SchemaService) {}

  onModuleInit() {
    const raw = this.schemaService.getSchemaContext();
    this.compiledSchema = this.compactSchema(raw);
    this.logger.log(
      `Schema compiled (${this.compiledSchema.length} chars, ${this.compiledSchema.split('\n').length} lines)`,
    );
    this.logger.debug(`Compiled schema:\n${this.compiledSchema}`);
  }

  /**
   * Convert the verbose SchemaService output into a compact DDL-like format
   * that small LLMs (7B) parse reliably.
   *
   * Input:  "TABLE: users\n  Columns: id (INTEGER, NOT NULL), nom (STRING, NOT NULL) ..."
   * Output: "- users: id INT, nom TEXT, prenom TEXT, role TEXT, actif BOOL [FK: stationId->stations]"
   *
   * Including types helps the model avoid hallucinating columns that don't exist.
   */
  private compactSchema(raw: string): string {
    const lines: string[] = [];

    /** Map verbose Sequelize type keys to short SQL-like abbreviations */
    const typeMap: Record<string, string> = {
      INTEGER: 'INT', BIGINT: 'BIGINT', SMALLINT: 'SMALLINT',
      FLOAT: 'FLOAT', DOUBLE: 'FLOAT', DECIMAL: 'DECIMAL', REAL: 'FLOAT',
      STRING: 'TEXT', TEXT: 'TEXT', CHAR: 'TEXT', VARCHAR: 'TEXT',
      BOOLEAN: 'BOOL',
      DATE: 'DATE', DATEONLY: 'DATE', NOW: 'DATE',
      JSON: 'JSON', JSONB: 'JSON',
      UUID: 'UUID', UUIDV4: 'UUID',
      ENUM: 'ENUM', ARRAY: 'ARRAY',
      BLOB: 'BLOB', VIRTUAL: 'VIRTUAL',
    };

    for (const block of raw.split(/\n\n+/)) {
      const tableMatch = block.match(/^TABLE:\s*(\S+)/);
      if (!tableMatch) continue;

      const table = tableMatch[1];
      const colMatch = block.match(/Columns:\s*(.+)/);
      if (!colMatch) continue;

      // Each column entry looks like: "colName (TYPE, NULLABLE FK->ref)"
      // Split on "), " to separate complete column entries
      const colEntries = colMatch[1].split(/\),\s*/);

      const colDefs: string[] = [];
      const fks: string[] = [];

      for (const entry of colEntries) {
        // Column name is everything before the first " ("
        const name = entry.replace(/\s*\(.*$/, '').trim();
        if (!name) continue;

        // Extract type from inside parentheses
        const typeMatch = entry.match(/\((\w+)/);
        const rawType = typeMatch ? typeMatch[1] : '?';
        const shortType = typeMap[rawType] ?? rawType;

        colDefs.push(`${name} ${shortType}`);

        // Extract FK target if present
        const fkMatch = entry.match(/FK->(\w+)/);
        if (fkMatch) {
          fks.push(`${name}->${fkMatch[1]}`);
        }
      }

      // Store column names for error enrichment
      const colNames = colDefs.map((d) => d.split(' ')[0]);
      this.tableColumns.set(table, colNames);

      let line = `- ${table}: ${colDefs.join(', ')}`;
      if (fks.length) line += ` [FK: ${fks.join(', ')}]`;
      lines.push(line);
    }

    return lines.join('\n');
  }

  /**
   * When the DB error mentions "column X does not exist", try to find
   * which table was involved and return its actual column list.
   */
  private enrichError(error: string, failedSql: string | null): string {
    let enriched = error;

    // Pattern: column <alias>.<col> does not exist  OR  column "<col>" does not exist
    const colNotFound = error.match(
      /column (?:(\w+)\.)?\"?(\w+)\"? does not exist/i,
    );
    if (colNotFound) {
      const alias = colNotFound[1]; // e.g. "p"
      const badCol = colNotFound[2]; // e.g. "statut"

      // Try to resolve alias -> table name from the failed SQL
      let resolvedTable: string | null = null;
      if (alias && failedSql) {
        // Match patterns like: FROM performances p, JOIN performances p, etc.
        const aliasRegex = new RegExp(
          `(?:FROM|JOIN)\\s+(\\w+)\\s+(?:AS\\s+)?${alias}\\b`,
          'i',
        );
        const aliasMatch = failedSql.match(aliasRegex);
        if (aliasMatch) resolvedTable = aliasMatch[1];
      }

      // Find actual columns for the table
      if (resolvedTable && this.tableColumns.has(resolvedTable)) {
        const cols = this.tableColumns.get(resolvedTable)!;
        enriched += `\nThe table "${resolvedTable}" does NOT have a "${badCol}" column. Its actual columns are: ${cols.join(', ')}. Use ONLY these columns.`;
      } else {
        // List all tables that have 'statut' so the model picks the right one
        const tablesWithCol: string[] = [];
        for (const [tbl, cols] of this.tableColumns) {
          if (cols.includes(badCol)) tablesWithCol.push(tbl);
        }
        if (tablesWithCol.length > 0) {
          enriched += `\nThe column "${badCol}" only exists in these tables: ${tablesWithCol.join(', ')}. Check your table references.`;
        } else {
          enriched += `\nThe column "${badCol}" does not exist in ANY table. Do NOT use it. Re-read the schema carefully.`;
        }
      }
    }

    return enriched;
  }

  build(
    userQuestion: string,
    previousError: string | null,
    failedSql: string | null = null,
  ): string {
    let errorBlock = '';
    if (previousError) {
      const enrichedError = this.enrichError(previousError, failedSql);
      this.logger.debug(`Enriched error for retry: ${enrichedError}`);
      errorBlock = `\nERROR from previous attempt: ${enrichedError}\nYou MUST fix this error. Do NOT use the same wrong column. Re-read the schema above and ONLY use columns that exist. Remove any column that caused the error.`;
    }

    const prompt = `You are an expert PostgreSQL query generator. Generate ONLY a SELECT query, nothing else.

Schema:
${this.compiledSchema}

Business context:
This is a car wash management system. Use the schema above to answer ANY question the user asks. Think step by step about which tables and joins are needed.

Key concepts:
- "fiche de piste" = fiches_piste (wash session). statut: open, in_progress, completed
- "coupon" = coupons (tracks wash amount). statut: pending, washing, done, paid
- coupon_washers = join table linking coupons to laveurs (washers)
- Revenue / Chiffre d'affaires / recettes = paiements WHERE type='income'. SUM(montant) gives total revenue.
- Expenses / dépenses = paiements WHERE type='expense'. Also mouvements_stock WHERE typeMouvement='entree' represents supply purchases.
- Profit / bénéfice = total income paiements - total expense paiements
- factures = invoices (formal document). paiements = actual money movements.
- types_lavage has prixBase (wash price). produits has prix (product price).
- Employees: users table. Roles: super_admin, manager, controleur, caissiere, laveur, commercial, comptable
- Employee-station link: affectations table (userId + stationId). Filter statut='active' for current assignments.
- Station names (e.g. "Nkolbikok", "Playce") are in stations.nom. City is stations.town.
- Payment methods (paiements.methode): cash, card, wave, orange_money, transfer, bond
- sanctions: types avertissement/suspension/renvoi, statut active/levee
- bons_lavage = discount codes (pourcentage discount)
- mouvements_stock typeMouvement: entree (purchase), sortie (usage), ajustement

Rules:
1. Output ONLY a SELECT query. No markdown, no explanation, no code fences.
2. NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER.
3. Quote camelCase columns: "stationId", "pointsFidelite", "montantTotal", "typeLavageId", "prixBase", "typeMouvement", "fichePisteId", "clientId", "userId", "vehicleId", "controleurId", "quantiteStock", "quantiteAlerte", "dateDebut", "dateFin", "createdAt", "globalAccess", "bonusParLavage", "objectifJournalier".
4. If the question cannot be answered, return exactly: INVALID_QUERY
5. ONLY use columns listed in the schema above. NEVER invent or guess column names.
6. LIMIT 100 unless specified otherwise.

Examples:
User: "Combien de fiches de piste ouvertes aujourd'hui ?"
SELECT COUNT(*) AS total FROM fiches_piste WHERE date = CURRENT_DATE AND statut = 'open';

User: "chiffre d'affaires global"
SELECT COALESCE(SUM(montant), 0) AS chiffre_affaires FROM paiements WHERE type = 'income';

User: "combien de lavages a fait Junior ?"
SELECT COALESCE(SUM(p."vehiculesLaves"), 0) AS total_lavages FROM performances p JOIN users u ON p."userId" = u.id WHERE u.prenom ILIKE '%Junior%';

User: "chiffre d'affaires de nkolbikok ce mois"
SELECT COALESCE(SUM(p.montant), 0) AS chiffre_affaires FROM paiements p JOIN stations s ON p."stationId" = s.id WHERE p.type = 'income' AND s.nom ILIKE '%nkolbikok%' AND p."createdAt" >= DATE_TRUNC('month', CURRENT_DATE);

User: "liste des laveurs"
SELECT u.id, u.nom, u.prenom FROM users u WHERE u.role = 'laveur' LIMIT 100;

User: "produits en alerte de stock"
SELECT id, nom, "quantiteStock", "quantiteAlerte" FROM produits WHERE "quantiteStock" <= "quantiteAlerte" LIMIT 100;

User: "${userQuestion}"${errorBlock}
`;

    return prompt;
  }
}
