export type { HelpArticleMeta, HelpHeading, HelpIndex, HelpRole, HelpSearchDoc, HelpSection, HelpStatus } from "./types";
export { fold, slugify, tokenize } from "./text";
export {
  editDistance,
  searchHelp,
  searchHelpDetailed,
  type HelpSearchCorrection,
  type HelpSearchHit,
  type HelpSearchOptions,
  type HelpSearchResult,
} from "./search";
export { splitHighlights, type HighlightPart } from "./highlight";
export { groupSectionArticles, type HelpArticleGroup } from "./groups";
export { answerFromArticle, isConfidentAnswer, type HelpAnswer } from "./answer";
export { articlesForScreen, screenMatches, toProductionRoute } from "./screens";
