using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Manada.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "manada");

            migrationBuilder.CreateTable(
                name: "audit_events",
                schema: "manada",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OccurredUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActorSubject = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TargetType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    TargetId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Outcome = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CorrelationId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Details = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "organizations",
                schema: "manada",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organizations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "permissions",
                schema: "manada",
                columns: table => new
                {
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permissions", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "system_settings",
                schema: "manada",
                columns: table => new
                {
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_settings", x => x.Key);
                });

            migrationBuilder.CreateTable(
                name: "users",
                schema: "manada",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    LastSignInUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                    table.CheckConstraint("ck_users_role", "\"Role\" IN ('SuperAdmin','Admin','Staff','Customer')");
                    table.CheckConstraint("ck_users_status", "\"Status\" IN ('PendingVerification','Active','Disabled')");
                });

            migrationBuilder.CreateTable(
                name: "branches",
                schema: "manada",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_branches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_branches_organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalSchema: "manada",
                        principalTable: "organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "role_permissions",
                schema: "manada",
                columns: table => new
                {
                    Role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PermissionCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_permissions", x => new { x.Role, x.PermissionCode });
                    table.ForeignKey(
                        name: "FK_role_permissions_permissions_PermissionCode",
                        column: x => x.PermissionCode,
                        principalSchema: "manada",
                        principalTable: "permissions",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "auth_sessions",
                schema: "manada",
                columns: table => new
                {
                    Key = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProtectedTicket = table.Column<byte[]>(type: "bytea", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    ExpiresUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    RevokedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auth_sessions", x => x.Key);
                    table.ForeignKey(
                        name: "FK_auth_sessions_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "manada",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "customer_profiles",
                schema: "manada",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    CompanyName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ProfileCompletedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_profiles", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_customer_profiles_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "manada",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "external_identities",
                schema: "manada",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Issuer = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Subject = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_external_identities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_external_identities_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "manada",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "staff_profiles",
                schema: "manada",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    JobTitle = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: true),
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_staff_profiles", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_staff_profiles_branches_BranchId",
                        column: x => x.BranchId,
                        principalSchema: "manada",
                        principalTable: "branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_staff_profiles_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "manada",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                schema: "manada",
                table: "organizations",
                columns: new[] { "Id", "CreatedUtc", "Name", "UpdatedUtc" },
                values: new object[] { new Guid("0f6b6a5e-2d3c-4f7a-9b1e-000000000001"), new DateTimeOffset(new DateTime(2026, 11, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Manada Embroidery Machine Solution", new DateTimeOffset(new DateTime(2026, 11, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.InsertData(
                schema: "manada",
                table: "permissions",
                columns: new[] { "Code", "Description" },
                values: new object[,]
                {
                    { "audit.read", "View security audit events" },
                    { "customer.self", "Use customer self-service areas" },
                    { "profile.self", "View and update own profile" },
                    { "roles.assign", "Assign roles to accounts" },
                    { "roles.permissions.manage", "Manage role-permission assignments" },
                    { "settings.manage", "Manage system settings" },
                    { "users.manage.admins", "Create and manage Admin accounts" },
                    { "users.manage.customers", "Manage customer accounts and records" },
                    { "users.manage.staff", "Create and manage Staff accounts" },
                    { "users.read", "View accounts within the caller's management scope" }
                });

            migrationBuilder.InsertData(
                schema: "manada",
                table: "role_permissions",
                columns: new[] { "PermissionCode", "Role" },
                values: new object[,]
                {
                    { "profile.self", "Admin" },
                    { "users.manage.customers", "Admin" },
                    { "users.manage.staff", "Admin" },
                    { "users.read", "Admin" },
                    { "customer.self", "Customer" },
                    { "profile.self", "Customer" },
                    { "profile.self", "Staff" },
                    { "audit.read", "SuperAdmin" },
                    { "customer.self", "SuperAdmin" },
                    { "profile.self", "SuperAdmin" },
                    { "roles.assign", "SuperAdmin" },
                    { "roles.permissions.manage", "SuperAdmin" },
                    { "settings.manage", "SuperAdmin" },
                    { "users.manage.admins", "SuperAdmin" },
                    { "users.manage.customers", "SuperAdmin" },
                    { "users.manage.staff", "SuperAdmin" },
                    { "users.read", "SuperAdmin" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_events_Action",
                schema: "manada",
                table: "audit_events",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_audit_events_ActorUserId",
                schema: "manada",
                table: "audit_events",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_events_OccurredUtc",
                schema: "manada",
                table: "audit_events",
                column: "OccurredUtc");

            migrationBuilder.CreateIndex(
                name: "IX_auth_sessions_UserId",
                schema: "manada",
                table: "auth_sessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_branches_OrganizationId_Code",
                schema: "manada",
                table: "branches",
                columns: new[] { "OrganizationId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_external_identities_Issuer_Subject",
                schema: "manada",
                table: "external_identities",
                columns: new[] { "Issuer", "Subject" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_external_identities_UserId",
                schema: "manada",
                table: "external_identities",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_PermissionCode",
                schema: "manada",
                table: "role_permissions",
                column: "PermissionCode");

            migrationBuilder.CreateIndex(
                name: "IX_staff_profiles_BranchId",
                schema: "manada",
                table: "staff_profiles",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                schema: "manada",
                table: "users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_events",
                schema: "manada");

            migrationBuilder.DropTable(
                name: "auth_sessions",
                schema: "manada");

            migrationBuilder.DropTable(
                name: "customer_profiles",
                schema: "manada");

            migrationBuilder.DropTable(
                name: "external_identities",
                schema: "manada");

            migrationBuilder.DropTable(
                name: "role_permissions",
                schema: "manada");

            migrationBuilder.DropTable(
                name: "staff_profiles",
                schema: "manada");

            migrationBuilder.DropTable(
                name: "system_settings",
                schema: "manada");

            migrationBuilder.DropTable(
                name: "permissions",
                schema: "manada");

            migrationBuilder.DropTable(
                name: "branches",
                schema: "manada");

            migrationBuilder.DropTable(
                name: "users",
                schema: "manada");

            migrationBuilder.DropTable(
                name: "organizations",
                schema: "manada");
        }
    }
}
