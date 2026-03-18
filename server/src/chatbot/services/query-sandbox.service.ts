import { Injectable, Logger } from '@nestjs/common';

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

@Injectable()
export class QuerySandboxService {
  private readonly logger = new Logger(QuerySandboxService.name);

  private readonly FORBIDDEN_PATTERNS: RegExp[] = [
    /\b(INSERT)\b/i,
    /\b(UPDATE)\b/i,
    /\b(DELETE)\b/i,
    /\b(DROP)\b/i,
    /\b(TRUNCATE)\b/i,
    /\b(ALTER)\b/i,
    /\b(CREATE)\b/i,
    /\b(GRANT)\b/i,
    /\b(REVOKE)\b/i,
    /\b(EXECUTE|EXEC)\b/i,
    /\b(COPY)\b/i,
    /\b(COMMIT)\b/i,
    /\b(ROLLBACK)\b/i,
    /\b(SAVEPOINT)\b/i,
    /\b(SET\s+\w+\s*=)/i,
    /\b(INTO\s+\w+\s+VALUES)\b/i,
    /;\s*\S/,
    /--/,
    /\/\*/,
    /\bpg_\w+/i,
    /\binformation_schema\b/i,
    /\bpg_catalog\b/i,
    /\\copy\b/i,
    /\bLO_IMPORT\b/i,
    /\bLO_EXPORT\b/i,
  ];

  private readonly BLOCKED_COLUMNS: RegExp[] = [
    /\bpassword\b/i,
    /\bemail\b/i,
    /\btelephone\b/i,
    /\bcontact\b/i,
    /\b"?referenceExterne"?\b/,
    /\b"?justificatif"?\b/,
    /\b"?prospectTelephone"?\b/,
    /\b"?prospectNom"?\b/,
    /\b"?userPhone"?\b/,
    /\b"?requestBody"?\b/,
  ];

  private readonly BLOCKED_TABLES: RegExp[] = [
    /\baudit_logs\b/i,
    /\bcampaigns\b/i,
    /\bcampaign_recipients\b/i,
    /\bsms_templates\b/i,
  ];

  validate(sql: string): ValidationResult {
    const trimmed = sql.trim().replace(/;$/, '');

    if (!/^SELECT\b/i.test(trimmed)) {
      this.logger.warn(`Rejected: does not start with SELECT`);
      return { valid: false, reason: 'La requête doit commencer par SELECT' };
    }

    for (const pattern of this.FORBIDDEN_PATTERNS) {
      if (pattern.test(trimmed)) {
        this.logger.warn(`Rejected: forbidden pattern ${pattern.source}`);
        return { valid: false, reason: 'Opération non autorisée détectée' };
      }
    }

    for (const pattern of this.BLOCKED_COLUMNS) {
      if (pattern.test(trimmed)) {
        this.logger.warn(`Rejected: blocked column ${pattern.source}`);
        return { valid: false, reason: 'Accès à une colonne restreinte' };
      }
    }

    for (const pattern of this.BLOCKED_TABLES) {
      if (pattern.test(trimmed)) {
        this.logger.warn(`Rejected: blocked table ${pattern.source}`);
        return { valid: false, reason: 'Accès à une table restreinte' };
      }
    }

    const semicolonCount = (trimmed.match(/;/g) || []).length;
    if (semicolonCount > 0) {
      this.logger.warn(`Rejected: multiple statements`);
      return { valid: false, reason: 'Plusieurs instructions détectées' };
    }

    return { valid: true };
  }
}
