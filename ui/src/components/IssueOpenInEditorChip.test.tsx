// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import type { ExecutionWorkspace, Project } from "@paperclipai/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IssueOpenInEditorChip } from "./IssueOpenInEditorChip";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function makeWorkspace(overrides: Partial<ExecutionWorkspace> = {}): ExecutionWorkspace {
  return {
    id: "ws-1",
    companyId: "co-1",
    projectId: "pr-1",
    projectWorkspaceId: null,
    sourceIssueId: null,
    mode: "isolated_workspace",
    strategyType: "git_worktree",
    name: "ws-1",
    status: "active",
    cwd: "/Users/dev/projects/onboarding",
    repoUrl: null,
    baseRef: null,
    branchName: "feature-1",
    providerType: "git_worktree",
    providerRef: null,
    derivedFromExecutionWorkspaceId: null,
    lastUsedAt: new Date(),
    openedAt: new Date(),
    closedAt: null,
    cleanupEligibleAt: null,
    cleanupReason: null,
    config: null,
    metadata: null,
    runtimeServices: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function projectWithCodebase(localFolder: string | null): Pick<Project, "codebase"> {
  return {
    codebase: {
      workspaceId: null,
      repoUrl: null,
      repoRef: null,
      defaultRef: null,
      repoName: null,
      localFolder,
      managedFolder: localFolder ?? "/Users/dev/managed",
      effectiveLocalFolder: localFolder ?? "/Users/dev/managed",
      origin: localFolder ? "local_folder" : "managed_checkout",
    },
  };
}

describe("IssueOpenInEditorChip", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("renders an anchor with a vscode:// href and the basename when an open execution workspace exists", () => {
    const root = createRoot(container);
    act(() => {
      root.render(
        <IssueOpenInEditorChip
          issue={{
            currentExecutionWorkspace: makeWorkspace({ cwd: "/Users/dev/wt/issue-77" }),
            project: projectWithCodebase("/Users/dev/proj"),
          }}
        />,
      );
    });
    const anchor = container.querySelector<HTMLAnchorElement>('[data-testid="issue-open-in-editor-chip"]');
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute("href")).toBe("vscode://file/Users/dev/wt/issue-77");
    expect(anchor?.dataset.openInEditorSource).toBe("execution_workspace");
    expect(anchor?.textContent).toContain("issue-77");
    expect(anchor?.title).toContain("/Users/dev/wt/issue-77");
    act(() => root.unmount());
  });

  it("renders nothing when the execution workspace is archived", () => {
    const root = createRoot(container);
    act(() => {
      root.render(
        <IssueOpenInEditorChip
          issue={{
            currentExecutionWorkspace: makeWorkspace({ status: "archived" }),
            project: projectWithCodebase("/Users/dev/proj"),
          }}
        />,
      );
    });
    expect(container.querySelector('[data-testid="issue-open-in-editor-chip"]')).toBeNull();
    act(() => root.unmount());
  });

  it("falls back to project codebase when no execution workspace exists", () => {
    const root = createRoot(container);
    act(() => {
      root.render(
        <IssueOpenInEditorChip
          issue={{
            currentExecutionWorkspace: null,
            project: projectWithCodebase("/Users/dev/projects/onboarding"),
          }}
        />,
      );
    });
    const anchor = container.querySelector<HTMLAnchorElement>('[data-testid="issue-open-in-editor-chip"]');
    expect(anchor?.getAttribute("href")).toBe("vscode://file/Users/dev/projects/onboarding");
    expect(anchor?.dataset.openInEditorSource).toBe("project_codebase");
    expect(anchor?.textContent).toContain("onboarding");
    act(() => root.unmount());
  });

  it("renders nothing when there is no workspace and no project codebase", () => {
    const root = createRoot(container);
    act(() => {
      root.render(
        <IssueOpenInEditorChip
          issue={{
            currentExecutionWorkspace: null,
            project: null,
          }}
        />,
      );
    });
    expect(container.querySelector('[data-testid="issue-open-in-editor-chip"]')).toBeNull();
    act(() => root.unmount());
  });
});
