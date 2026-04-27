import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("merges multiple class names into one string", () => {
    const result = cn("px-4", "py-2", "text-sm");
    expect(result).toBe("px-4 py-2 text-sm");
  });

  it("drops falsy class names", () => {
    const active = false;
    const result = cn("base", active && "active", "end");
    expect(result).toBe("base end");
  });

  it("resolves tailwind conflicts — last class wins", () => {
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });

  it("handles undefined and null gracefully", () => {
    const result = cn("foo", undefined, null as any, "bar");
    expect(result).toBe("foo bar");
  });
});
