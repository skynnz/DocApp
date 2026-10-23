import { describe, expect, it } from "vitest";

import {
  checkLoginRateLimit,
  clearLoginFailures,
  recordLoginFailure,
} from "./rate-limit";

describe("login rate limit", () => {
  it("bloquea después de cinco fallos y se limpia al acertar", () => {
    const key = `test-${Date.now()}-${Math.random()}`;

    expect(checkLoginRateLimit(key).allowed).toBe(true);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordLoginFailure(key);
    }

    expect(checkLoginRateLimit(key).allowed).toBe(false);

    clearLoginFailures(key);
    expect(checkLoginRateLimit(key).allowed).toBe(true);
  });
});
