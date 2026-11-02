import assert from "assert";
import {
  enforceWaf,
  enforceRateLimit,
  validatePathname,
  validateSafeUrl,
  nexchatAsmGuard,
} from "./api/_security.js";

console.log("==================================================================");
console.log("🛡️  TESTING NEXCHAT FORTRESS SECURITY & TAB 30 ACTIVE DEFENSES");
console.log("==================================================================");

// Mock HTTP Request / Response objects
function createMockReqRes({
  url = "/",
  method = "GET",
  headers = {},
  query = {},
  body = {},
} = {}) {
  const req = {
    url,
    method,
    headers: { "x-forwarded-for": "198.51.100.42", ...headers },
    query,
    body,
  };

  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, val) {
      this.headers[name] = val;
    },
    json(obj) {
      this.body = obj;
      return this;
    },
    send(str) {
      this.body = str;
      return this;
    },
    end(str) {
      this.body = str;
      return this;
    },
  };

  return { req, res };
}

// ================================================================
// [TEST 1] TAB 30 ASM SHELLCODE DISASSEMBLER & FEIGNED CRASH TRAP
// ================================================================
console.log("\n[TEST 1] Testing Tab 30 ASM Shellcode Trap & 'Pretend-to-Fall' Lure...");
// 23-byte polymorphic Linux /bin/sh shellcode
const shellcodePayload = "0x31c050682f2f7368682f62696e89e3505389e1b00bcd80";
const { req: asmReq, res: asmRes } = createMockReqRes({
  url: "/api/ai",
  body: { prompt: shellcodePayload },
  headers: { "x-forwarded-for": "203.0.113.88" },
});

const isSafe = enforceWaf(asmReq, asmRes);
assert(isSafe === false, "Hostile shellcode must be intercepted");
assert(asmRes.statusCode === 500, "Feigned crash must return HTTP 500");
assert(typeof asmRes.body === "string" && asmRes.body.includes("double free or corruption"), "Must return authentic glibc crash dump");
assert(asmRes.body.includes("Aborted (core dumped)"), "Must conclude with glibc core dump");
assert(asmRes.headers["X-Vault-Handle"]?.startsWith("0x"), "Must return AES-256-GCM binary handle in X-Vault-Handle header");

// Zero framework traces check
const lowerCrash = asmRes.body.toLowerCase();
assert(!lowerCrash.includes("node"), "Must not leak 'node'");
assert(!lowerCrash.includes("express"), "Must not leak 'express'");
assert(!lowerCrash.includes("vercel"), "Must not leak 'vercel'");
console.log(" [PASS] Intercepted shellcode and emitted authentic glibc double-free core dump!");
console.log(" [PASS] AES-256-GCM Binary Sealed Dossier Handle: " + asmRes.headers["X-Vault-Handle"].slice(0, 32) + "...");

// ================================================================
// [TEST 2] SQL & NoSQL INJECTION DEFENSE (Protocol 1)
// ================================================================
console.log("\n[TEST 2] Testing SQL Injection & NoSQL AST Lexical Shield...");
// 2.1 SQL Injection test
const { req: sqliReq, res: sqliRes } = createMockReqRes({
  url: "/api/reels?search=' OR 1=1--",
  headers: { "x-forwarded-for": "198.51.100.99" },
});
const sqliPassed = enforceWaf(sqliReq, sqliRes);
assert(sqliPassed === false, "SQLi payload must be blocked");
assert(sqliRes.statusCode === 403, "SQLi must return 403 Forbidden");
assert(sqliRes.body?.code === "WAF_VIOLATION", "Must return WAF_VIOLATION code");
console.log(" [PASS] Blocked ' OR 1=1-- injection payload with HTTP 403 WAF_VIOLATION");

// 2.2 NoSQL MongoDB operator injection test
const { req: nosqlReq, res: nosqlRes } = createMockReqRes({
  url: "/api/upload",
  body: { username: { "$gt": "" } },
  headers: { "x-forwarded-for": "198.51.100.101" },
});
const nosqlPassed = enforceWaf(nosqlReq, nosqlRes);
assert(nosqlPassed === false, "NoSQL operator must be blocked");
assert(nosqlRes.statusCode === 403, "NoSQLi must return 403");
console.log(" [PASS] Blocked NoSQL $gt operator injection with HTTP 403");

// ================================================================
// [TEST 3] SSRF CLOUD METADATA SHIELD
// ================================================================
console.log("\n[TEST 3] Testing Outbound & Inbound Anti-SSRF Defense...");
// Probe to AWS/GCP/Azure IMDS 169.254.169.254
const imdsCheck = validateSafeUrl("http://169.254.169.254/latest/meta-data/");
assert(imdsCheck.safe === false, "Must block AWS/GCP metadata IP 169.254.169.254");
console.log(" [PASS] Blocked SSRF probe to 169.254.169.254: " + imdsCheck.reason);

// Probe to Google Cloud internal metadata
const gcpCheck = validateSafeUrl("http://metadata.google.internal/computeMetadata/v1/");
assert(gcpCheck.safe === false, "Must block Google Cloud metadata domain");
console.log(" [PASS] Blocked SSRF probe to metadata.google.internal: " + gcpCheck.reason);

// Probe to private RFC-1918 subnet
const privateIpCheck = validateSafeUrl("http://192.168.1.1/admin");
assert(privateIpCheck.safe === false, "Must block private RFC-1918 IP");
console.log(" [PASS] Blocked SSRF probe to private 192.168.1.1: " + privateIpCheck.reason);

// Benign public URL
const benignCheck = validateSafeUrl("https://ai-security-scanner-delta.vercel.app/health");
assert(benignCheck.safe === true, "Must allow safe public HTTPS URL");
console.log(" [PASS] Permitted legitimate public outbound URL");

// ================================================================
// [TEST 4] SLIDING-WINDOW EDGE RATE LIMITING & AUTO-JAIL
// ================================================================
console.log("\n[TEST 4] Testing Sliding-Window Rate Limiting & Escalation...");
const spamIp = "198.51.100.222";
let rateLimitHit = false;

for (let i = 0; i < 65; i++) {
  const { req, res } = createMockReqRes({
    url: "/api/ai",
    headers: { "x-forwarded-for": spamIp },
  });
  const allowed = enforceRateLimit(req, res, 60);
  if (!allowed && res.statusCode === 429) {
    rateLimitHit = true;
    assert(res.body?.code === "RATE_LIMITED", "Must return RATE_LIMITED error");
    assert(res.headers["Retry-After"] !== undefined, "Must include Retry-After header");
    break;
  }
}
assert(rateLimitHit === true, "Rate limit threshold must trigger at 60 req/min");
console.log(" [PASS] Rate limiter triggered at limit with HTTP 429 RATE_LIMITED");

// ================================================================
// [TEST 5] PATH TRAVERSAL & PROHIBITED EXTENSIONS
// ================================================================
console.log("\n[TEST 5] Testing Path Traversal & Prohibited Extensions...");
assert(validatePathname("../../etc/passwd").valid === false, "Must reject directory traversal (..)");
assert(validatePathname("uploads/%2e%2e/secret.key").valid === false, "Must reject URL-encoded traversal (%2e%2e)");
assert(validatePathname("shell.php").valid === false, "Must reject .php extension");
assert(validatePathname("malware.exe").valid === false, "Must reject .exe extension");
assert(validatePathname("avatar.jpg").valid === true, "Must permit safe .jpg extension");
console.log(" [PASS] Path traversal and prohibited extensions strictly enforced");

console.log("\n==================================================================");
console.log("🎉 ALL NEXCHAT FORTRESS SECURITY & TAB 30 DEFENSE TESTS PASSED 100%!");
console.log("==================================================================");
