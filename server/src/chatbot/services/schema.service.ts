import { Injectable, OnModuleInit } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { InjectConnection } from '@nestjs/sequelize';

@Injectable()
export class SchemaService implements OnModuleInit {
  private schemaContext = '';

  private readonly EXCLUDED_TABLES = new Set([
    'audit_logs',
    'campaigns',
    'campaign_recipients',
    'sms_templates',
  ]);

  private readonly PII_COLUMNS: Record<string, Set<string>> = {
    users: new Set(['password', 'email', 'telephone']),
    clients: new Set(['contact', 'email']),
    stations: new Set(['contact']),
    fournisseurs: new Set(['contact']),
    paiements: new Set(['referenceExterne', 'justificatif']),
    commercial_registrations: new Set(['prospectNom', 'prospectTelephone']),
  };

  private readonly PII_PATTERNS = /^(password|token|secret|hash|salt)$/i;

  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async onModuleInit() {
    this.schemaContext = this.buildSchemaContext();
  }

  private buildSchemaContext(): string {
    const models = this.sequelize.modelManager.all as any[];
    const lines: string[] = [];

    for (const model of models) {
      const rawTableName = model.getTableName();
      const tableName =
        typeof rawTableName === 'string'
          ? rawTableName
          : rawTableName?.tableName ?? String(rawTableName);

      if (this.EXCLUDED_TABLES.has(tableName)) continue;

      const attrs: Record<string, any> = model.getAttributes();
      const piiSet = this.PII_COLUMNS[tableName] ?? new Set<string>();
      const safeColumns: string[] = [];

      for (const [colName, colDef] of Object.entries(attrs) as [string, any][]) {
        if (piiSet.has(colName)) continue;
        if (this.PII_PATTERNS.test(colName)) continue;

        const typeKey =
          colDef.type?.key ??
          colDef.type?.constructor?.name ??
          String(colDef.type);
        const nullable = colDef.allowNull === false ? 'NOT NULL' : 'NULLABLE';
        const field = colDef.field ?? colName;

        let fk = '';
        if (colDef.references) {
          const refModel =
            typeof colDef.references.model === 'string'
              ? colDef.references.model
              : colDef.references.model?.tableName ?? '';
          if (refModel) fk = ` FK->${refModel}`;
        }

        safeColumns.push(`${field} (${typeKey}, ${nullable}${fk})`);
      }

      const assocs = Object.values(model.associations ?? {}).map((a: any) => {
        const targetTable = a.target?.getTableName?.() ?? a.target?.name;
        return `${a.associationType} -> ${targetTable}`;
      });

      lines.push(`TABLE: ${tableName}`);
      lines.push(`  Columns: ${safeColumns.join(', ')}`);
      if (assocs.length) lines.push(`  Relations: ${assocs.join(', ')}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  getSchemaContext(): string {
    return this.schemaContext;
  }
}
