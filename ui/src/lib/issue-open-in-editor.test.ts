import { describe, expect, it } from "vitest";
import type { ExecutionWorkspace, Project } from "@paperclipai/shared";
import { basenameOfPath, resolveIssueOpenInEditor } from "./issue-open-in-editor";

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
    cwd: "/Users/dev/projects/co/issue-1",
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

describe("resolveIssueOpenInEditor", () => {
  it("returns the execution workspace cwd when the workspace is open and local", () => {
    const result = resolveIssueOpenInEditor({
      currentExecutionWorkspace: makeWorkspace({ cwd: "/Users/dev/wt/foo" }),
      project: projectWithCodebase("/Users/dev/proj"),
    });
    expect(result?.path).toBe("/Users/dev/wt/foo");
    expect(result?.source).toBe("execution_workspace");
    expect(result?.href).toBe("vscode://file/Users/dev/wt/foo");
  });

  it("hides the chip when the execution workspace is archived (cleaned up)", () => {
    const result = resolveIssueOpenInEditor({
      currentExecutionWorkspace: makeWorkspace({ status: "archived" }),
      project: projectWithCodebase("/Users/dev/proj"),
    });
    expect(result).toBeNull();
  });

  it("hides the chip when the execution workspace has closedAt set", () => {
    const result = resolveIssueOpenInEditor({
      currentExecutionWorkspace: makeWorkspace({ closedAt: new Date() }),
      project: projectWithCodebase("/Users/dev/proj"),
    });
    expect(result).toBeNull();
  });

  it("hides the chip when the workspace status is cleanup_failed", () => {
    const result = resolveIssueOpenInEditor({
      currentExecutionWorkspace: makeWorkspace({ status: "cleanup_failed" }),
      project: projectWithCodebase("/Users/dev/proj"),
    });
    expect(result).toBeNull();
  });

  it("hides the chip when the workspace provider is not local", () => {
    const result = resolveIssueOpenInEditor({
      currentExecutionWorkspace: makeWorkspace({ providerType: "cloud_sandbox" }),
      project: projectWithCodebase("/Users/dev/proj"),
    });
    expect(result).toBeNull();
  });

  it("hides the chip when the workspace cwd is null", () => {
    const result = resolveIssueOpenInEditor({
      currentExecutionWorkspace: makeWorkspace({ cwd: null }),
      project: projectWithCodebase("/Users/dev/proj"),
    });
    expect(result).toBeNull();
  });

  it("hides the chip when the workspace cwd is not a plausible absolute path", () => {
    const result = resolveIssueOpenInEditor({
      currentExecutionWorkspace: makeWorkspace({ cwd: "relative/path" }),
      project: projectWithCodebase("/Users/dev/proj"),
    });
    expect(result).toBeNull();
  });

  it("falls back to project codebase effectiveLocalFolder when no execution workspace exists", () => {
    const result = resolveIssueOpenInEditor({
      currentExecutionWorkspace: null,
      project: projectWithCodebase("/Users/dev/proj"),
    });
    expect(result?.path).toBe("/Users/dev/proj");
    expect(result?.source).toBe("project_codebase");
    expect(result?.href).toBe("vscode://file/Users/dev/proj");
  });

  it("does not fall back to project codebase when the workspace is closed", () => {
    const result = resolveIssueOpenInEditor({
      currentExecutionWorkspace: makeWorkspace({ status: "archived" }),
      project: projectWithCodebase("/Users/dev/proj"),
    });
    expect(result).toBeNull();
  });

  it("returns null when neither workspace nor project codebase is available", () => {
    const result = resolveIssueOpenInEditor({
      currentExecutionWorkspace: null,
      project: null,
    });
    expect(result).toBeNull();
  });

  it("encodes special characters in the path when building the vscode href", () => {
    const result = resolveIssueOpenInEditor({
      currentExecutionWorkspace: makeWorkspace({ cwd: "/Users/dev/proj with space" }),
      project: null,
    });
    expect(result?.href).toBe("vscode://file/Users/dev/proj%20with%20space");
  });
});

describe("basenameOfPath", () => {
  it("returns the last path segment", () => {
    expect(basenameOfPath("/Users/dev/projects/onboarding")).toBe("onboarding");
  });

  it("ignores trailing slashes", () => {
    expect(basenameOfPath("/Users/dev/projects/onboarding/")).toBe("onboarding");
  });

  it("returns the input when no slash is present", () => {
    expect(basenameOfPath("onboarding")).toBe("onboarding");
  });

  it("handles tilde-prefixed paths", () => {
    expect(basenameOfPath("~/projects/onboarding")).toBe("onboarding");
  });
});
