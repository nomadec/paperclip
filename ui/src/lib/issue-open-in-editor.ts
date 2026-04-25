import type { ExecutionWorkspace, Project } from "@paperclipai/shared";
import { buildVscodeFileHref, isPlausibleAbsolutePath } from "./absolute-path-link";

export type IssueOpenInEditorSource = "execution_workspace" | "project_codebase";

export interface IssueOpenInEditorTarget {
  path: string;
  href: string;
  source: IssueOpenInEditorSource;
}

const CLOSED_EXECUTION_WORKSPACE_STATUSES = new Set<ExecutionWorkspace["status"]>([
  "archived",
  "cleanup_failed",
]);

const LOCAL_PROVIDER_TYPES = new Set<ExecutionWorkspace["providerType"]>([
  "local_fs",
  "git_worktree",
]);

function isLocalAndOpen(workspace: ExecutionWorkspace): boolean {
  if (!LOCAL_PROVIDER_TYPES.has(workspace.providerType)) return false;
  if (workspace.closedAt != null) return false;
  if (CLOSED_EXECUTION_WORKSPACE_STATUSES.has(workspace.status)) return false;
  return true;
}

export interface IssueOpenInEditorInput {
  currentExecutionWorkspace?: ExecutionWorkspace | null;
  project?: Pick<Project, "codebase"> | null;
}

export function resolveIssueOpenInEditor(
  issue: IssueOpenInEditorInput,
): IssueOpenInEditorTarget | null {
  const workspace = issue.currentExecutionWorkspace ?? null;
  if (workspace) {
    if (workspace.cwd && isPlausibleAbsolutePath(workspace.cwd) && isLocalAndOpen(workspace)) {
      return {
        path: workspace.cwd,
        href: buildVscodeFileHref(workspace.cwd),
        source: "execution_workspace",
      };
    }
    return null;
  }

  const projectPath = issue.project?.codebase?.effectiveLocalFolder ?? null;
  if (projectPath && isPlausibleAbsolutePath(projectPath)) {
    return {
      path: projectPath,
      href: buildVscodeFileHref(projectPath),
      source: "project_codebase",
    };
  }
  return null;
}

export function basenameOfPath(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  if (trimmed.length === 0) return path;
  const idx = trimmed.lastIndexOf("/");
  if (idx < 0) return trimmed;
  const tail = trimmed.slice(idx + 1);
  return tail.length > 0 ? tail : trimmed;
}
