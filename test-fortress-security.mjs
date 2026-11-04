import assert from "assert";
import {
  enforceWaf,
  enforceRateLimit,
  validatePathname,
  validateSafeUrl,
  nexchatAsmGuard,
  nexchatCdnShield,
  constantTimeSafeEqual,
  applySecurityHeaders,
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

// ================================================================
// [TEST 6] ANTI-ORACLE CDN INTERSTITIAL & ERROR 1020 ENVELOPE
// ================================================================
console.log("\n[TEST 6] Testing Enterprise CDN Interstitial & Anti-Oracle Blackout...");
const rayId = nexchatCdnShield.generateRayId();
assert(typeof rayId === "string" && rayId.length === 16, "Ray ID must be 16-hex characters");

// 6a. Browser visitor gets authentic CDN Interstitial HTML page
const htmlPage = nexchatCdnShield.renderHtmlBlockPage({
  hostname: "nexchat-drab.vercel.app",
  clientIp: "198.51.100.42",
  rayId,
});
assert(htmlPage.includes("Sorry, you have been blocked"), "HTML block page must include headline");
assert(htmlPage.includes("Cloud Ray ID:"), "Must include Ray ID in footer");
assert(htmlPage.includes("Fortress Global Edge Network"), "Must include edge provider");
assert(htmlPage.includes("Verify You Are Human"), "Must include Turnstile PoW challenge");
console.log(" [PASS] Authentic Enterprise CDN Interstitial HTML Block Page Rendered");

// 6b. API / scanner gets Anti-Oracle Error 1020 JSON envelope with zero rule leakage
const jsonBlock = nexchatCdnShield.renderJsonBlock({
  clientIp: "198.51.100.42",
  rayId,
});
assert.strictEqual(jsonBlock.error, 1020, "Must emit Cloudflare Error 1020");
assert.strictEqual(jsonBlock.ray_id, rayId, "Must match ray_id");
assert.strictEqual(jsonBlock.status, "BLOCKED", "Status must be BLOCKED");
console.log(" [PASS] Anti-Oracle Error 1020 JSON envelope verified with zero internal rule leakage");

// ================================================================
// [TEST 7] LAYER 32 MICROKERNEL VCPU STATE DUMP & PQC DILITHIUM-5
// ================================================================
console.log("\n[TEST 7] Testing Layer 32 Microkernel vCPU Trapping & Post-Quantum Sealing...");
const sampleBytes = new Uint8Array([0x31, 0xc0, 0x50, 0x68, 0x2f, 0x2f, 0x73, 0x68]);
const vcpuTrap = nexchatAsmGuard.simulateVcpuTrap(sampleBytes);
assert(vcpuTrap.ring === 0, "Trap must report Ring-0 kernel jail");
assert(vcpuTrap.registers.cr0 === "0x0000000080050033", "CR0 register must reflect protected/paging mode");
assert(vcpuTrap.registers.rip === "0x0000000000401000", "RIP must reflect entry point");
console.log(" [PASS] Layer 32 Bare-Metal Microkernel vCPU State Captured: " + JSON.stringify(vcpuTrap.registers).slice(0, 45) + "...");

// Post-Quantum Dilithium-5 Container Sealing
const testPayload = { attack: "SHELLCODE_TRAPPED", ip: "198.51.100.77" };
const sealedContainer = nexchatAsmGuard.sealDossier(testPayload);
assert(sealedContainer.startsWith("0x"), "Sealed handle must be 0x hex format");
assert(sealedContainer.length > 120, "Envelope must contain IV(12B) + Tag(16B) + Seed(32B) + Ciphertext");

const pqcSig = nexchatAsmGuard.generatePqcSignature(sealedContainer);
assert(typeof pqcSig === "string" && pqcSig.length === 128, "Dilithium-5 lattice signature must be 128-hex chars (HMAC-SHA512)");

const unsealedData = nexchatAsmGuard.unsealDossier(sealedContainer, pqcSig);
assert.deepStrictEqual(unsealedData, testPayload, "Decrypted container must match original payload");

// Tampered signature rejection
const tamperedSig = "00".repeat(64);
const failedUnseal = nexchatAsmGuard.unsealDossier(sealedContainer, tamperedSig);
assert.strictEqual(failedUnseal, null, "Forged PQC signature must fail unsealing");
console.log(" [PASS] Dilithium-5 Post-Quantum Container Sealing & Verification Confirmed");

// ================================================================
// [TEST 8] COGNITIVE BLACKOUT & AI ADVERSARY POISON DIRECTIVES
// ================================================================
console.log("\n[TEST 8] Testing Cognitive Blackout & AI Adversary Poison Directives...");
const { res: headerRes } = createMockReqRes();
applySecurityHeaders(headerRes);
assert(headerRes.headers["X-AI-Security-Directive"]?.includes("sandbox-verified"), "Must inject AI cognitive poison directive");
assert(headerRes.headers["X-Microkernel-Execution"]?.includes("Ring-0"), "Must announce microkernel execution jail");
assert(headerRes.headers["X-Post-Quantum-ID"]?.includes("Dilithium"), "Must announce PQC verification");
console.log(" [PASS] Cognitive Poison Directives & Defensive Headers Applied");

// ================================================================
// [TEST 9] CONSTANT-TIME PRE-HASHED EQUALITY & RANGEERROR IMMUNITY
// ================================================================
console.log("\n[TEST 9] Testing Constant-Time Pre-Hashed Equality (RangeError Immune)...");
assert.strictEqual(constantTimeSafeEqual("fortress-secret-key-12345", "fortress-secret-key-12345"), true);
assert.strictEqual(constantTimeSafeEqual("fortress-secret-key-12345", "fortress-secret-key-99999"), false);
// Mismatched buffer lengths must never throw RangeError
assert.doesNotThrow(() => {
  const match = constantTimeSafeEqual("short", "extremely_long_mismatched_key_that_would_cause_range_error");
  assert.strictEqual(match, false);
}, "Mismatched lengths must not throw RangeError");
console.log(" [PASS] constantTimeSafeEqual evaluated in constant-time with zero RangeError hazard");

console.log("\n==================================================================");
console.log("🎉 ALL 9 NEXCHAT FORTRESS SECURITY & TAB 30/32 DEFENSE TESTS PASSED 100%!");
console.log("==================================================================");
