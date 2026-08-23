/* node api/book.test.js — checks the bits that would quietly break: escaping,
   the honeypot, and that nothing is sent without rows. */
const assert = require("assert");
process.env.RESEND_API_KEY = "test";
const handler = require("./book.js");

let payload = null;
global.fetch = async (_u, o) => ((payload = JSON.parse(o.body)), { ok: true, status: 200, text: async () => "" });

const run = async (body, method = "POST") => {
  payload = null;
  let out = {};
  const res = { status: (c) => ((out.code = c), res), json: (j) => ((out.body = j), res) };
  await handler({ method, body }, res);
  return out;
};

(async () => {
  assert.equal((await run({}, "GET")).code, 405);
  assert.equal((await run({ rows: [] })).code, 400);

  // honeypot: accepted so the bot sees success, but nothing is sent
  assert.equal((await run({ rows: [["a", "b"]], website: "spam" })).code, 200);
  assert.equal(payload, null);

  // script tags in an answer must not survive into the email body
  await run({ name: "Ben", rows: [["Notes", '<img src=x onerror="alert(1)">']] });
  assert.ok(!payload.html.includes("<img"), "unescaped HTML reached the email");
  assert.ok(payload.html.includes("&lt;img"));
  assert.equal(payload.to, "vividcustomsaz@gmail.com");
  assert.ok(!("reply_to" in payload), "junk email should not become reply_to");

  await run({ name: "Ben", replyTo: "a@b.com", rows: [["x", "y"]] });
  assert.equal(payload.reply_to, "a@b.com");

  // only real attachments, capped at 3
  await run({ rows: [["x", "y"]], attachments: [1, 2, 3, 4].map(() => ({ filename: "a.jpg", content: "AAA" })) });
  assert.equal(payload.attachments.length, 3);

  assert.equal((await run({ rows: [["x", "y"]] })).code, 200);
  console.log("all good");
})();
