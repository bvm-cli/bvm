import { describe, expect, test, mock } from "bun:test";
import { fetchBunVersionsFromNpm, findBunDownloadUrl } from "../src/api";

describe("API", () => {
  test("fetchBunVersionsFromNpm returns versions", async () => {
    // Mock fetch
    const mockFetch = mock(async () => new Response(JSON.stringify({
      versions: {
        "1.0.0": {},
        "1.1.0": {}
      }
    })));
    
    // We can't easily mock global fetch in Bun test directly for the module unless we inject it, 
    // but for now let's rely on the real network or skip if offline.
    // Actually, Bun test usually allows mocking.
    // Let's try a real request to npmjs (it's stable).
    
    const versions = await fetchBunVersionsFromNpm();
    expect(versions).toBeInstanceOf(Array);
    expect(versions.length).toBeGreaterThan(0);
    expect(versions).toContain("1.0.0"); // Bun 1.0.0 exists
  });



  test("findBunDownloadUrl resolves specific version", async () => {
    const result = await findBunDownloadUrl("1.0.0");
    expect(result).not.toBeNull();
    expect(result?.url).toContain("bun-v1.0.0");
    expect(result?.foundVersion).toBe("v1.0.0");
  });
});
