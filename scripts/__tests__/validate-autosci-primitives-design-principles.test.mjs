import test from "node:test";
import assert from "node:assert/strict";

import {
  GRANDFATHERED_NO_DESIGN_PRINCIPLES,
  validatePrimitiveDesignPrinciples,
} from "../validate-papers-deepread.mjs";

test("primitive design_principles validation grandfathers existing gaps and enforces new primitives", () => {
  assert.equal(GRANDFATHERED_NO_DESIGN_PRINCIPLES.size, 7);

  assert.deepEqual(validatePrimitiveDesignPrinciples({
    primitive_id: "reverse-synthesis-coverage-aware-eval",
  }, "grandfathered"), []);

  assert.deepEqual(validatePrimitiveDesignPrinciples({
    primitive_id: "new-primitive-with-design",
    design_principles: [{ id: "explicit-principle" }],
  }, "new-with-design"), []);

  assert.match(
    validatePrimitiveDesignPrinciples({
      primitive_id: "new-primitive-without-design",
    }, "new-without-design").join("\n"),
    /new-without-design: design_principles must be a non-empty array/,
  );
});
