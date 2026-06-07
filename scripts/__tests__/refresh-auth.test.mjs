import { test } from "node:test";
import assert from "node:assert/strict";

import { isAuthorizedRefreshToken } from "../lib/refresh-auth.mjs";

const SECRET = "s3cret-token";

test("rejects when no token is provided", () => {
  assert.equal(isAuthorizedRefreshToken(undefined, SECRET), false);
  assert.equal(isAuthorizedRefreshToken(null, SECRET), false);
  assert.equal(isAuthorizedRefreshToken("", SECRET), false);
});

test("rejects a non-string token", () => {
  assert.equal(isAuthorizedRefreshToken(123, SECRET), false);
  assert.equal(isAuthorizedRefreshToken({ token: SECRET }, SECRET), false);
});

test("rejects a wrong token", () => {
  assert.equal(isAuthorizedRefreshToken("nope", SECRET), false);
});

test("accepts the exact configured token", () => {
  assert.equal(isAuthorizedRefreshToken(SECRET, SECRET), true);
});

test("fails closed when REFRESH_TOKEN is unset", () => {
  // expected === undefined/empty => every request denied, even a matching-looking one
  assert.equal(isAuthorizedRefreshToken("anything", undefined), false);
  assert.equal(isAuthorizedRefreshToken("", undefined), false);
  assert.equal(isAuthorizedRefreshToken("", ""), false);
});

test("reads process.env.REFRESH_TOKEN by default", () => {
  const prev = process.env.REFRESH_TOKEN;
  try {
    process.env.REFRESH_TOKEN = SECRET;
    assert.equal(isAuthorizedRefreshToken(SECRET), true);
    assert.equal(isAuthorizedRefreshToken("wrong"), false);
    delete process.env.REFRESH_TOKEN;
    assert.equal(isAuthorizedRefreshToken(SECRET), false);
  } finally {
    if (prev === undefined) delete process.env.REFRESH_TOKEN;
    else process.env.REFRESH_TOKEN = prev;
  }
});
