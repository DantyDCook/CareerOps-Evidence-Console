import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function sourceFiles(root: string): string[] {
  const absolute = path.join(process.cwd(), root);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(child);
    return /\.(ts|tsx)$/.test(entry.name) ? [child] : [];
  });
}

describe("credential and Workspace boundary", () => {
  it("keeps Engine credentials out of browser-visible modules", () => {
    const browserFiles = sourceFiles("src").filter((file) => {
      const content = read(file);
      return content.includes('"use client"') || file.endsWith("src/lib/evidence-client.ts");
    });

    for (const file of browserFiles) {
      const content = read(file);
      expect(content, file).not.toContain("CAREEROPS_ENGINE_API_TOKEN");
      expect(content, file).not.toContain("CAREEROPS_ENGINE_BASE_URL");
      expect(content, file).not.toContain("NEXT_PUBLIC_");
      expect(content, file).not.toContain("Authorization");
    }
  });

  it("contains no direct Workspace filesystem access in application source", () => {
    for (const file of sourceFiles("src")) {
      const content = read(file);
      expect(content, file).not.toContain("CareerOps-Workspace/career_evidence");
      expect(content, file).not.toContain("career_evidence/");
    }
  });

  it("keeps bearer construction in the server gateway", () => {
    const serverGateway = read("src/lib/server/evidence-gateway.ts");
    expect(serverGateway).toContain("CAREEROPS_ENGINE_API_TOKEN");
    expect(serverGateway).toContain("Authorization");
  });
});
