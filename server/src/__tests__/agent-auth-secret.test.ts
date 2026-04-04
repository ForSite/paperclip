import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ensureAgentJwtSecret,
  readAgentJwtSecretFromEnv,
  readAgentJwtSecretFromEnvFile,
} from "../agent-auth-secret.js";

const ORIGINAL_ENV = { ...process.env };

function tempEnvPath(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paperclip-server-jwt-"));
  return path.join(dir, ".env");
}

describe("server agent auth secret helper", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.PAPERCLIP_AGENT_JWT_SECRET;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("creates and loads a missing secret", () => {
    const envPath = tempEnvPath();

    const result = ensureAgentJwtSecret(envPath);

    expect(result.created).toBe(true);
    expect(result.loadedFromFile).toBe(false);
    expect(result.secret).toHaveLength(64);
    expect(readAgentJwtSecretFromEnv()).toBe(result.secret);
    expect(readAgentJwtSecretFromEnvFile(envPath)).toBe(result.secret);
  });

  it("loads an existing secret from env file", () => {
    const envPath = tempEnvPath();
    fs.writeFileSync(envPath, "PAPERCLIP_AGENT_JWT_SECRET=file-secret\n", { mode: 0o600 });

    const result = ensureAgentJwtSecret(envPath);

    expect(result.created).toBe(false);
    expect(result.loadedFromFile).toBe(true);
    expect(result.secret).toBe("file-secret");
    expect(readAgentJwtSecretFromEnv()).toBe("file-secret");
  });
});
