// FIX-BUG: preserva leitura de locks sem versão durante a migração do manifesto declarativo.
const FORMAT = "agents-governance-manifest";
const VERSION = 2;
const MARKER = "governance-manifest/v2";

function convertLegacyLock(lock) {
  if (!lock || typeof lock !== "object" || Array.isArray(lock)) {
    throw new Error("Lock legado invalido.");
  }

  const managedFiles = Array.isArray(lock.managedFiles) ? lock.managedFiles : Object.keys(lock.files || {}).map((path) => ({ path }));
  return {
    ...lock,
    format: FORMAT,
    marker: MARKER,
    managedFiles,
    schema: VERSION,
  };
}

function isCurrentLock(lock) {
  return Boolean(lock && lock.format === FORMAT && lock.schema === VERSION && lock.marker === MARKER && Array.isArray(lock.managedFiles));
}

module.exports = { FORMAT, MARKER, VERSION, convertLegacyLock, isCurrentLock };
