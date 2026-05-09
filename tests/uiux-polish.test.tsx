import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouter } from "../src/AppRouter";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const adminMarkup = renderToStaticMarkup(<AppRouter path="/admin/content" />);
assert(adminMarkup.includes("Review cockpit"), "admin page should present a compact review cockpit");
assert(adminMarkup.includes("Open items"), "admin page should summarize open review items");
assert(adminMarkup.includes("Blocking signals"), "admin page should highlight blocking quality signals");

const filteredToolsMarkup = renderToStaticMarkup(<AppRouter path="/tools?tag=AI%20Coding" />);
assert(filteredToolsMarkup.includes("结果集"), "directory pages should show a result summary");
assert(filteredToolsMarkup.includes("重置筛选"), "directory pages should provide a reset action");
