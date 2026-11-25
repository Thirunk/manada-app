#!/bin/bash
# Creates separate roles and databases on first start of the local volume.
#   manada_owner  owns the Manada schema and runs migrations (DDL). Never used by the running API.
#   manada_app    runtime account for the API. DML only, cannot alter the schema or the audit table.
#   keycloak_app  owns the Keycloak database. Used only by Keycloak.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<EOSQL
CREATE ROLE manada_owner LOGIN PASSWORD '${MANADA_OWNER_PASSWORD}';
CREATE ROLE manada_app LOGIN PASSWORD '${MANADA_APP_PASSWORD}';
CREATE ROLE keycloak_app LOGIN PASSWORD '${KEYCLOAK_DB_PASSWORD}';
CREATE DATABASE manada OWNER manada_owner;
CREATE DATABASE keycloak OWNER keycloak_app;
REVOKE CONNECT ON DATABASE manada FROM PUBLIC;
REVOKE CONNECT ON DATABASE keycloak FROM PUBLIC;
GRANT CONNECT ON DATABASE manada TO manada_app;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname manada <<EOSQL
CREATE SCHEMA IF NOT EXISTS manada AUTHORIZATION manada_owner;
GRANT USAGE ON SCHEMA manada TO manada_app;
ALTER DEFAULT PRIVILEGES FOR ROLE manada_owner IN SCHEMA manada GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO manada_app;
ALTER DEFAULT PRIVILEGES FOR ROLE manada_owner IN SCHEMA manada GRANT USAGE, SELECT ON SEQUENCES TO manada_app;
EOSQL
