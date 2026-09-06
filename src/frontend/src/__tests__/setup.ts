import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Generated components use `data-ocid` attributes as their stable test hooks.
configure({ testIdAttribute: "data-ocid" });

// TanStack Query hashes query keys with JSON.stringify, which throws on BigInt.
// main.tsx installs this polyfill for the running app; tests need it too.
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// With `globals: false`, RTL cannot auto-register its afterEach cleanup, so
// renders would stack across tests and duplicate every element. Clean up
// explicitly.
afterEach(() => {
  cleanup();
});

// Radix UI Select calls `scrollIntoView` on the highlighted option when the
// list opens, which jsdom does not implement. Without this stub, opening any
// Select throws "candidate?.scrollIntoView is not a function".
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = () => {};
}

// Radix UI Select's pointer handlers call `hasPointerCapture` on the target
// during pointer events, which jsdom does not implement. Without these stubs,
// userEvent-driven Select interactions throw "target.hasPointerCapture is not
// a function".
if (typeof Element.prototype.hasPointerCapture !== "function") {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

// Radix Select's popper positioning (@floating-ui/dom) uses ResizeObserver to
// track the trigger's size. jsdom does not implement it, so opening a Select
// throws and unmounts the whole tree. Provide a no-op stub.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Radix Select reads matchMedia for some behaviors; jsdom does not implement
// it. Provide a minimal stub so opening a Select does not throw.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// Radix Select's scroll buttons use IntersectionObserver to decide when to
// show; jsdom does not implement it. Provide a no-op stub so opening a Select
// does not throw.
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}
