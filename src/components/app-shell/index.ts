export { AdminShell } from "./AdminShell";
export { ShellHeaderSlot } from "./shellHeaderSlot";
export type { ShellMode } from "./shellTypes";
export { ShellRailSlot } from "./shellRailSlot";
export { ShellAgentPanelSlot } from "./shellAgentPanelSlot";
export {
  ShellConfigContext,
  useShellConfig,
  resolveShellConfig,
  userInitials,
  DEFAULT_SHELL_CONFIG,
  DEFAULT_SHELL_CHROME,
  DEFAULT_WORKSPACE_LABELS,
  type ShellConfig,
  type ShellWorkspaceLabels,
  type ShellChrome,
  type ShellConfigOverrides,
  type ShellUser,
  type ShellBrand,
  type ShellPromo,
} from "./shellConfig";
export { RoleMenu, type RoleMenuProps } from "./RoleMenu";
export { PersonalizationMenu, type PersonalizationMenuProps } from "./PersonalizationMenu";
export { CompanyMenu, CompanyMark, type CompanyMenuProps } from "./CompanyMenu";
export { AccountMenu, type AccountMenuProps } from "./AccountMenu";
export { WorkspaceUsage, companyMeta } from "./workspaceUsage";
export { WorkspaceMenu, type WorkspaceMenuProps } from "./WorkspaceMenu";
export { HeaderChip, type HeaderChipProps } from "./HeaderChip";
export { BrandMark, type BrandMarkProps } from "./BrandMark";
export type {
  NavEntry,
  NavRoot,
  NavChild,
  NavLeaf,
  NotificationItem,
  NewsItem,
  Company,
  ChatHistoryGroup,
  UserRoleOption,
  SettingsItem,
  SettingsGroup,
} from "./appShellData";
