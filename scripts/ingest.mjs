#!/usr/bin/env node
import { main } from "./run.mjs";

main(["projects", "all", ...process.argv.slice(2)]).catch((error) => {
  console.error(error);
  process.exit(1);
});
