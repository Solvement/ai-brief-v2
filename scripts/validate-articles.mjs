import { readFile } from "node:fs/promises";

const file = new URL("../public/data/articles.json", import.meta.url);
const archiveFile = new URL("../public/data/articles-archive.json", import.meta.url);
const raw = await readFile(file, "utf8");
const data = JSON.parse(raw);
const archiveData = await readFile(archiveFile, "utf8").then((text) => JSON.parse(text)).catch((error) => {
  if (error?.code === "ENOENT") return null;
  throw error;
});
const errors = [];
const paperTypes = new Set([
  "benchmark_evaluation",
  "system_method",
  "agent_architecture",
  "survey",
  "theory_algorithm",
  "product_engineering_blog",
]);
const EXPECTED_ACTIVE_PAPER_LIMIT = 5;

function fail(path, message) {
  errors.push(`${path}: ${message}`);
}

function isIso(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isScore(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function validateString(value, path) {
  if (!isNonEmptyString(value)) fail(path, "must be a non-empty string");
}

function validateTextBlock(value, path, minLength = 80) {
  validateString(value, path);
  if (isNonEmptyString(value) && value.trim().length < minLength) {
    fail(path, `must be at least ${minLength} characters`);
  }
}

function validateStringArray(value, path, min = 1) {
  if (!Array.isArray(value)) {
    fail(path, "must be an array");
    return;
  }
  if (value.length < min) fail(path, `must have at least ${min} item(s)`);
  value.forEach((item, index) => validateString(item, `${path}[${index}]`));
}

function validateSources(sources, path) {
  if (!Array.isArray(sources) || sources.length === 0) {
    fail(path, "must include at least one source");
    return;
  }
  sources.forEach((source, index) => {
    validateString(source?.name, `${path}[${index}].name`);
    validateString(source?.url, `${path}[${index}].url`);
    if (isNonEmptyString(source?.url) && !/^https:\/\/.+/.test(source.url)) {
      fail(`${path}[${index}].url`, "must be an https URL");
    }
  });
}

function validateVersion(version, path) {
  for (const key of ["id", "label", "versionType", "changeSummary", "whyChanged", "readerQuestion", "evidence"]) {
    validateString(version?.[key], `${path}.${key}`);
  }
  if (!isIso(version?.submittedAt)) fail(`${path}.submittedAt`, "must be an ISO date");
  if (!isScore(version?.impactScore)) fail(`${path}.impactScore`, "must be a number from 0 to 100");
}

function validateChart(chart, path) {
  for (const key of ["title", "metric", "unit"]) validateString(chart?.[key], `${path}.${key}`);
  if (chart?.maxValue !== undefined && (!Number.isFinite(chart.maxValue) || chart.maxValue <= 0)) {
    fail(`${path}.maxValue`, "must be a positive number when present");
  }
  if (!Array.isArray(chart?.bars) || chart.bars.length < 2) {
    fail(`${path}.bars`, "must have at least 2 item(s)");
    return;
  }
  chart.bars.forEach((bar, index) => {
    validateString(bar?.label, `${path}.bars[${index}].label`);
    validateString(bar?.display, `${path}.bars[${index}].display`);
    if (!Number.isFinite(bar?.value) || bar.value < 0) {
      fail(`${path}.bars[${index}].value`, "must be a non-negative number");
    }
  });
}

function validatePlainLanguage(value, path) {
  for (const key of ["beginnerSummary", "mentalModel", "whyItWorks", "oneThingToRemember"]) {
    validateString(value?.[key], `${path}.${key}`);
  }
}

function validatePrerequisiteTerm(value, path) {
  for (const key of ["term", "plainMeaning", "whyItMatters"]) {
    validateString(value?.[key], `${path}.${key}`);
  }
}

function validateDesignChoice(value, path) {
  for (const key of ["title", "choice", "why", "tradeoff"]) {
    validateString(value?.[key], `${path}.${key}`);
  }
}

function validateFlowStep(value, path) {
  for (const key of ["label", "title", "body"]) {
    validateString(value?.[key], `${path}.${key}`);
  }
}

function validateIdeaArchitecture(value, path) {
  for (const key of ["centralQuestion", "coreMove", "optimizationLogic"]) {
    validateString(value?.[key], `${path}.${key}`);
  }
  if (!Array.isArray(value?.designChoices) || value.designChoices.length < 2) {
    fail(`${path}.designChoices`, "must have at least 2 item(s)");
  } else {
    value.designChoices.forEach((choice, index) => validateDesignChoice(choice, `${path}.designChoices[${index}]`));
  }
  if (!Array.isArray(value?.methodFlow) || value.methodFlow.length < 3) {
    fail(`${path}.methodFlow`, "must have at least 3 item(s)");
  } else {
    value.methodFlow.forEach((step, index) => validateFlowStep(step, `${path}.methodFlow[${index}]`));
  }
}

function validateArchitectureBlock(value, path) {
  for (const key of ["label", "title", "role", "beginnerExplanation", "connectsTo"]) {
    validateString(value?.[key], `${path}.${key}`);
  }
}

function validateArchitectureWalkthrough(value, path) {
  for (const key of ["originalPaperBoundary", "modernExtensionBoundary"]) {
    validateString(value?.[key], `${path}.${key}`);
  }
  if (!Array.isArray(value?.blocks) || value.blocks.length < 3) {
    fail(`${path}.blocks`, "must have at least 3 item(s)");
  } else {
    value.blocks.forEach((block, index) => validateArchitectureBlock(block, `${path}.blocks[${index}]`));
  }
}

function validateEvidenceLens(value, path) {
  for (const key of ["benchmarkTakeaway", "whatWasCompared", "whatToTrust", "whatNotToOverclaim"]) {
    validateString(value?.[key], `${path}.${key}`);
  }
}

function validateExperimentReading(value, path) {
  for (const key of ["question", "setup", "metric", "result", "conclusion", "limitation"]) {
    validateString(value?.[key], `${path}.${key}`);
  }
}

function validateStudyLens(value, path) {
  validateString(value?.professorExplanation, `${path}.professorExplanation`);
  validateStringArray(value?.beginnerPath, `${path}.beginnerPath`, 2);
  validateStringArray(value?.commonMisreadings, `${path}.commonMisreadings`, 2);
  validateString(value?.practicePrompt, `${path}.practicePrompt`);
}

function validateVerificationTask(value, path) {
  for (const key of ["level", "title", "task", "commonMistake", "sampleAnswer"]) {
    validateString(value?.[key], `${path}.${key}`);
  }
  validateStringArray(value?.passCriteria, `${path}.passCriteria`, 2);
}

function validateBenchmarkEvaluation(value, path) {
  for (const key of ["researchQuestion", "challengedConclusion", "whyImportant"]) {
    validateTextBlock(value?.paperQuestion?.[key], `${path}.paperQuestion.${key}`, 40);
  }
  validateTextBlock(value?.narrativeExplanation, `${path}.narrativeExplanation`, 240);

  if (!Array.isArray(value?.termPrimer) || value.termPrimer.length < 3) {
    fail(`${path}.termPrimer`, "must have at least 3 term explanations");
  } else {
    value.termPrimer.forEach((term, index) => {
      validateString(term?.term, `${path}.termPrimer[${index}].term`);
      validateTextBlock(term?.explanation, `${path}.termPrimer[${index}].explanation`, 70);
      if (term?.missingEvidence !== undefined) validateString(term.missingEvidence, `${path}.termPrimer[${index}].missingEvidence`);
    });
  }

  if (!Array.isArray(value?.claimMap) || value.claimMap.length < 3) {
    fail(`${path}.claimMap`, "must have at least 3 claims");
  } else {
    value.claimMap.forEach((claim, index) => {
      for (const key of ["claim", "evidence", "possibleCounterpoint", "confidence"]) {
        validateTextBlock(claim?.[key], `${path}.claimMap[${index}].${key}`, key === "confidence" ? 2 : 30);
      }
      if (claim?.missingEvidence !== undefined) validateString(claim.missingEvidence, `${path}.claimMap[${index}].missingEvidence`);
    });
  }

  if (!Array.isArray(value?.experimentMatrix) || value.experimentMatrix.length < 3) {
    fail(`${path}.experimentMatrix`, "must have at least 3 experiments");
  } else {
    value.experimentMatrix.forEach((experiment, index) => {
      for (const key of ["experimentName", "input", "hiddenInformation", "metric", "whatItTests", "whyItMatters"]) {
        validateTextBlock(experiment?.[key], `${path}.experimentMatrix[${index}].${key}`, key === "experimentName" || key === "metric" ? 4 : 30);
      }
      if (experiment?.missingEvidence !== undefined) validateString(experiment.missingEvidence, `${path}.experimentMatrix[${index}].missingEvidence`);
    });
  }

  if (!Array.isArray(value?.resultsAnalysis) || value.resultsAnalysis.length < 3) {
    fail(`${path}.resultsAnalysis`, "must have at least 3 result analyses");
  } else {
    value.resultsAnalysis.forEach((result, index) => {
      for (const key of ["mainResult", "interpretation", "supportsClaim", "alternativeExplanation"]) {
        validateTextBlock(result?.[key], `${path}.resultsAnalysis[${index}].${key}`, 40);
      }
      if (result?.missingEvidence !== undefined) validateString(result.missingEvidence, `${path}.resultsAnalysis[${index}].missingEvidence`);
    });
  }

  validateStringArray(value?.criticalReview?.strengths, `${path}.criticalReview.strengths`, 2);
  validateStringArray(value?.criticalReview?.weaknesses, `${path}.criticalReview.weaknesses`, 2);
  validateStringArray(value?.criticalReview?.missingExperiments, `${path}.criticalReview.missingExperiments`, 1);
  validateStringArray(value?.criticalReview?.generalizationLimits, `${path}.criticalReview.generalizationLimits`, 1);
  validateStringArray(value?.criticalReview?.counterArguments, `${path}.criticalReview.counterArguments`, 1);

  validateTextBlock(value?.applicationDeploymentTranslation?.howToUse, `${path}.applicationDeploymentTranslation.howToUse`, 80);
  validateTextBlock(value?.applicationDeploymentTranslation?.concreteImplementationIdea, `${path}.applicationDeploymentTranslation.concreteImplementationIdea`, 100);
  validateStringArray(value?.applicationDeploymentTranslation?.evaluationChecklist, `${path}.applicationDeploymentTranslation.evaluationChecklist`, 3);
  validateStringArray(value?.applicationDeploymentTranslation?.failureModes, `${path}.applicationDeploymentTranslation.failureModes`, 2);

  validateTextBlock(value?.interviewCard?.sixtySecondExplanation, `${path}.interviewCard.sixtySecondExplanation`, 150);
  validateStringArray(value?.interviewCard?.interviewQuestions, `${path}.interviewCard.interviewQuestions`, 3);
  validateTextBlock(value?.interviewCard?.strongPersonalOpinion, `${path}.interviewCard.strongPersonalOpinion`, 50);
  validateTextBlock(value?.interviewCard?.smallProjectIdea, `${path}.interviewCard.smallProjectIdea`, 50);

  if (value?.missingEvidence !== undefined) validateStringArray(value.missingEvidence, `${path}.missingEvidence`, 1);
}

function validateTemplateDecision(value, path, paperType) {
  if (!paperTypes.has(value?.suggestedPaperType)) fail(`${path}.suggestedPaperType`, "must be a supported paper type");
  if (!paperTypes.has(value?.activePaperType)) fail(`${path}.activePaperType`, "must be a supported paper type");
  if (value?.activePaperType !== paperType) fail(`${path}.activePaperType`, "must match paper.paperType");
  validateString(value?.confidence, `${path}.confidence`);
  validateString(value?.reason, `${path}.reason`);
  validateStringArray(value?.requiredModules, `${path}.requiredModules`, 1);
  if (value?.fallbackReason !== undefined) validateString(value.fallbackReason, `${path}.fallbackReason`);
}

function validateQualityDecision(value, path) {
  if (!isScore(value?.qualityScore)) fail(`${path}.qualityScore`, "must be a number from 0 to 100");
  if (!["must_read", "strong", "archive", "ignore"].includes(value?.tier)) fail(`${path}.tier`, "must be a supported quality tier");
  validateString(value?.selectionReason, `${path}.selectionReason`);
  validateStringArray(value?.qualitySignals, `${path}.qualitySignals`, 1);
  validateStringArray(value?.redFlags, `${path}.redFlags`, 0);
  validateString(value?.recommendedUse, `${path}.recommendedUse`);
  validateString(value?.archiveValue, `${path}.archiveValue`);
  if (typeof value?.selectedForDaily !== "boolean") fail(`${path}.selectedForDaily`, "must be boolean");
}

function validatePaper(paper, path) {
  for (const key of [
    "id",
    "title",
    "shortTitle",
    "authors",
    "venue",
    "arxivId",
    "oneSentenceTakeaway",
    "whyItMatters",
    "readingTime",
    "actionLabel",
    "difficulty",
    "recommendedAction",
    "sourceName",
    "sourceUrl",
    "versionQuestion",
    "versionRelation",
  ]) {
    validateString(paper?.[key], `${path}.${key}`);
  }
  if (!paperTypes.has(paper?.paperType)) fail(`${path}.paperType`, "must be a supported paper type");
  validateTemplateDecision(paper?.templateDecision, `${path}.templateDecision`, paper?.paperType);
  validateQualityDecision(paper?.qualityDecision, `${path}.qualityDecision`);
  if (paper?.contentType !== "paper") fail(`${path}.contentType`, "must be paper");
  if (!isIso(paper?.publishedAt)) fail(`${path}.publishedAt`, "must be an ISO date");
  if (!isIso(paper?.updatedAt)) fail(`${path}.updatedAt`, "must be an ISO date");
  for (const key of ["impactScore", "readabilityScore", "actionabilityScore", "confidenceScore"]) {
    if (!isScore(paper?.[key])) fail(`${path}.${key}`, "must be a number from 0 to 100");
  }
  validateStringArray(paper?.targetAudience, `${path}.targetAudience`, 1);
  validateStringArray(paper?.tags, `${path}.tags`, 1);
  validateStringArray(paper?.conceptMap, `${path}.conceptMap`, 2);
  validateStringArray(paper?.nextSteps, `${path}.nextSteps`, 1);
  validateSources(paper?.sources, `${path}.sources`);
  if (!Array.isArray(paper?.versions) || paper.versions.length < 2) {
    fail(`${path}.versions`, "must have at least 2 versions");
  } else {
    paper.versions.forEach((version, index) => validateVersion(version, `${path}.versions[${index}]`));
  }
  if (!Array.isArray(paper?.charts) || paper.charts.length < 1) {
    fail(`${path}.charts`, "must have at least 1 item");
  } else {
    paper.charts.forEach((chart, index) => validateChart(chart, `${path}.charts[${index}]`));
  }
  for (const key of ["thesis", "background", "method", "experiments", "limitations", "professorLens"]) {
    validateString(paper?.analysis?.[key], `${path}.analysis.${key}`);
  }
  validateStringArray(paper?.analysis?.verificationChecklist, `${path}.analysis.verificationChecklist`, 2);
  validatePlainLanguage(paper?.plainLanguage, `${path}.plainLanguage`);
  if (!Array.isArray(paper?.prerequisiteTerms) || paper.prerequisiteTerms.length < 3) {
    fail(`${path}.prerequisiteTerms`, "must have at least 3 item(s)");
  } else {
    paper.prerequisiteTerms.forEach((term, index) => validatePrerequisiteTerm(term, `${path}.prerequisiteTerms[${index}]`));
  }
  validateIdeaArchitecture(paper?.ideaArchitecture, `${path}.ideaArchitecture`);
  validateArchitectureWalkthrough(paper?.architectureWalkthrough, `${path}.architectureWalkthrough`);
  validateEvidenceLens(paper?.evidenceLens, `${path}.evidenceLens`);
  if (!Array.isArray(paper?.experimentReadings) || paper.experimentReadings.length < 1) {
    fail(`${path}.experimentReadings`, "must have at least 1 item");
  } else {
    paper.experimentReadings.forEach((item, index) => validateExperimentReading(item, `${path}.experimentReadings[${index}]`));
  }
  validateStudyLens(paper?.studyLens, `${path}.studyLens`);
  if (!Array.isArray(paper?.verificationTasks) || paper.verificationTasks.length < 3) {
    fail(`${path}.verificationTasks`, "must have at least 3 item(s)");
  } else {
    paper.verificationTasks.forEach((task, index) => validateVerificationTask(task, `${path}.verificationTasks[${index}]`));
  }
  if (paper?.paperType === "benchmark_evaluation") {
    if (!paper?.benchmarkEvaluation) fail(`${path}.benchmarkEvaluation`, "must exist for benchmark_evaluation papers");
    validateBenchmarkEvaluation(paper?.benchmarkEvaluation, `${path}.benchmarkEvaluation`);
  }
}

if (!data || typeof data !== "object") fail("$", "must be an object");
if (!isIso(data?.generatedAt)) fail("$.generatedAt", "must be an ISO date");
if (!Number.isInteger(data?.dailyLimit) || data.dailyLimit !== EXPECTED_ACTIVE_PAPER_LIMIT) {
  fail("$.dailyLimit", "must be exactly 5");
}
if (!Number.isInteger(data?.activeCount) || data.activeCount !== EXPECTED_ACTIVE_PAPER_LIMIT) {
  fail("$.activeCount", "must be exactly 5");
}
if (!Array.isArray(data?.papers) || data.papers.length === 0) {
  fail("$.papers", "must contain exactly five papers");
} else {
  if (data.papers.length !== data.dailyLimit || data.papers.length !== data.activeCount) {
    fail("$.papers", "must contain exactly five papers and match dailyLimit/activeCount");
  }
  const seen = new Set();
  data.papers.forEach((paper, index) => {
    const path = `$.papers[${index}]`;
    if (seen.has(paper?.id)) fail(`${path}.id`, "must be unique");
    seen.add(paper?.id);
    validatePaper(paper, path);
    if (paper?.qualityDecision?.selectedForDaily !== true) {
      fail(`${path}.qualityDecision.selectedForDaily`, "must be true for active papers");
    }
  });
}

if (archiveData) {
  if (!isIso(archiveData?.generatedAt)) fail("$.archive.generatedAt", "must be an ISO date");
  if (!Array.isArray(archiveData?.papers)) {
    fail("$.archive.papers", "must be an array");
  } else {
    const seenArchive = new Set();
    archiveData.papers.forEach((paper, index) => {
      const path = `$.archive.papers[${index}]`;
      if (seenArchive.has(paper?.id)) fail(`${path}.id`, "must be unique");
      seenArchive.add(paper?.id);
      validatePaper(paper, path);
      if (!isIso(paper?.archivedAt)) fail(`${path}.archivedAt`, "must be an ISO date");
      validateString(paper?.archiveReason, `${path}.archiveReason`);
      validateStringArray(paper?.reusableFor, `${path}.reusableFor`, 1);
    });
  }
}

if (errors.length > 0) {
  throw new Error(`articles.json validation failed:\n${errors.join("\n")}`);
}

console.log("articles.json validation passed");
