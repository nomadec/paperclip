import { FolderOpen } from "lucide-react";
import {
  basenameOfPath,
  resolveIssueOpenInEditor,
  type IssueOpenInEditorInput,
  type IssueOpenInEditorSource,
} from "../lib/issue-open-in-editor";

const SOURCE_TOOLTIP: Record<IssueOpenInEditorSource, string> = {
  execution_workspace: "Open execution worktree in VS Code / Cursor",
  project_codebase: "Open project workspace in VS Code / Cursor",
};

interface IssueOpenInEditorChipProps {
  issue: IssueOpenInEditorInput;
}

export function IssueOpenInEditorChip({ issue }: IssueOpenInEditorChipProps) {
  const target = resolveIssueOpenInEditor(issue);
  if (!target) return null;
  const label = basenameOfPath(target.path) || target.path;
  return (
    <a
      href={target.href}
      title={`${SOURCE_TOOLTIP[target.source]}\n${target.path}`}
      data-testid="issue-open-in-editor-chip"
      data-open-in-editor-source={target.source}
      className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 shrink-0 hover:bg-amber-500/20 transition-colors min-w-0 max-w-[160px]"
    >
      <FolderOpen className="h-3 w-3 shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  );
}
