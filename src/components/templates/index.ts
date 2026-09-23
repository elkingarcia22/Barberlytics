/**
 * Plantillas: la ficha de una plantilla y el catálogo completo en un panel.
 */

export {
  TemplateStage,
  TemplateThumb,
  TemplateTile,
  type TemplateStageProps,
  type TemplateThumbProps,
  type TemplateThumbSize,
  type TemplateTileProps,
  type TemplateTileVariant,
} from "./TemplateTile";
export {
  TemplateCatalogDrawer,
  type TemplateCatalogDrawerProps,
} from "./TemplateCatalogDrawer";
export {
  featuredTemplate,
  findTemplate,
  matchesTemplateQuery,
  suggestTemplates,
  templateThumbWeights,
  type TemplateDefinition,
  type TemplateGroup,
  type TemplateItem,
} from "./templateTypes";
