using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Manada.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AuditImmutabilityAndGrants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Audit records are append-only. The trigger rejects updates, deletes and truncation
            // for every role, including the owner, so tampering requires dropping the trigger.
            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION manada.reject_audit_mutation() RETURNS trigger
                LANGUAGE plpgsql AS $$
                BEGIN
                    RAISE EXCEPTION 'audit_events is append-only';
                END;
                $$;
                """);

            migrationBuilder.Sql("""
                CREATE TRIGGER audit_events_reject_update_delete
                    BEFORE UPDATE OR DELETE ON manada.audit_events
                    FOR EACH ROW EXECUTE FUNCTION manada.reject_audit_mutation();
                """);

            migrationBuilder.Sql("""
                CREATE TRIGGER audit_events_reject_truncate
                    BEFORE TRUNCATE ON manada.audit_events
                    FOR EACH STATEMENT EXECUTE FUNCTION manada.reject_audit_mutation();
                """);

            // The runtime role may only insert and read audit events.
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'manada_app') THEN
                        REVOKE UPDATE, DELETE, TRUNCATE ON manada.audit_events FROM manada_app;
                    END IF;
                END
                $$;
                """);

            migrationBuilder.Sql("""
                ALTER TABLE manada.audit_events
                    ADD CONSTRAINT ck_audit_events_outcome CHECK ("Outcome" IN ('Success', 'Denied', 'Failed'));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE manada.audit_events DROP CONSTRAINT IF EXISTS ck_audit_events_outcome;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS audit_events_reject_truncate ON manada.audit_events;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS audit_events_reject_update_delete ON manada.audit_events;");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS manada.reject_audit_mutation();");
        }
    }
}
