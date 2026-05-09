// Public surface of the Node-only persistence layer. Browser code MUST NOT
// import from this module because `node:sqlite` is a Node-only API. Keep this
// layer limited to scripts, ingestion jobs, and future SSR/server routes.

export { openDb, closeDb, resetDb, type OpenDbOptions } from "./db";
export {
  bulkUpsertContent,
  countContent,
  deleteContentItem,
  getContentBySlug,
  getContentItem,
  listContent,
  upsertContentItem,
  type ListContentOptions,
} from "./repositories/content";
export {
  clearEvaluations,
  getEvaluationByCacheKey,
  listEvaluationsForContent,
  listStaleEvaluations,
  putEvaluation,
  type PutEvaluationInput,
} from "./repositories/evaluation";
export {
  deleteSignalsForContent,
  listAllSignalsByContent,
  readSignalsForContent,
  writeSignalsForContent,
} from "./repositories/signals";
