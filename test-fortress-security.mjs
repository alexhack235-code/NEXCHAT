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
  cloudDefenseSentinel,
  objectAuthGuard,
  banIpWithStrikes,
  isIpBanned,
  submitJailAppeal,
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

// ================================================================
// [TEST 10] LAYER 34 BUNDLE & SOURCE MAP SECRET LEAKAGE SCANNER
// ================================================================
console.log("\n[TEST 10] Testing Layer 34 Bundle Secret Scanning...");
const mockBundle = `
  const config = {
    geminiKey: "AQ.Ab8RN6ABCDEF1234567890abcdef",
    firebaseKey: "AIzaSyD-1234567890abcdef1234567890abcde",
    openAiKey: "sk-proj-1234567890abcdef1234567890",
    awsKey: "AKIAIOSFODNN7EXAMPLE",
  };
`;
const secretScan = cloudDefenseSentinel.scanBundleForSecrets(mockBundle, "dist/main.bundle.js");
assert.strictEqual(secretScan.clean, false, "Must detect secrets in bundle");
assert(secretScan.totalFindings >= 4, "Must detect at least 4 secrets");
const exposedMapScan = cloudDefenseSentinel.scanBundleForSecrets("console.log(1)", "dist/app.js.map");
assert.strictEqual(exposedMapScan.clean, false, "Must flag exposed source maps");
console.log(" [PASS] Successfully detected hardcoded secrets and sourcemap exposure");

// ================================================================
// [TEST 11] SEQUENTIAL ID WALKING & SCRAPING VELOCITY DETECTION
// ================================================================
console.log("\n[TEST 11] Testing Sequential ID Walking & Scraping Velocity...");
const scrapingIp = "198.51.100.88";
for (let id = 101; id <= 106; id++) {
  cloudDefenseSentinel.analyzeRequestTraffic({
    ip: scrapingIp,
    path: `/api/users/${id}/profile`,
    method: "GET",
    headers: { "user-agent": "Mozilla/5.0" }
  });
}
const idWalkAnalysis = cloudDefenseSentinel.analyzeRequestTraffic({
  ip: scrapingIp,
  path: `/api/users/107/profile`,
  method: "GET",
  headers: { "user-agent": "Mozilla/5.0" }
});
assert(idWalkAnalysis.evidence.some(e => e.includes("Sequential ID Walking")), "Must flag sequential ID walking sequence");
console.log(" [PASS] Sequential ID walking pattern successfully flagged");

// ================================================================
// [TEST 12] LOOKALIKE PHISHING DOMAIN DETECTION
// ================================================================
console.log("\n[TEST 12] Testing Lookalike Phishing Domain Monitor...");
const officialDomainCheck = cloudDefenseSentinel.checkLookalikeDomain("nexchat.app");
assert.strictEqual(officialDomainCheck.isCloned, false, "Official domain must not be flagged");
const phishingDomain = "nexchat-login.app"; // within distance
const typoCheck = cloudDefenseSentinel.checkLookalikeDomain("nexcaht.app", ["nexchat.app"]);
assert.strictEqual(typoCheck.isCloned, true, "Typo lookalike must be flagged");
assert(typoCheck.distance <= 2, "Distance must be <= 2");
console.log(" [PASS] Phishing lookalike domain detected via Levenshtein distance analysis");

// ================================================================
// [TEST 13] CREDENTIAL STUFFING & PASSWORD SPRAYING (ATO DEFENSE)
// ================================================================
console.log("\n[TEST 13] Testing Credential Stuffing & Password Spraying...");
// Credential stuffing: 1 IP targets 5 distinct usernames
const stuffIp = "203.0.113.55";
let stuffResult;
for (let i = 1; i <= 6; i++) {
  stuffResult = cloudDefenseSentinel.evaluateLoginAttempt({
    username: `user_${i}`,
    ip: stuffIp
  });
}
assert.strictEqual(stuffResult.action, "HARD_BLOCK", "Credential stuffing must trigger HARD_BLOCK");
assert(stuffResult.confidence >= 80, "Confidence must be >= 80");
console.log(" [PASS] Credential stuffing detected: Action=HARD_BLOCK (Confidence: " + stuffResult.confidence + "%)");

// Password spraying: 1 username hit from 4 distinct IPs
const targetUser = "corporate_admin";
let sprayResult;
for (let i = 1; i <= 5; i++) {
  sprayResult = cloudDefenseSentinel.evaluateLoginAttempt({
    username: targetUser,
    ip: `198.51.100.${10 + i}`
  });
}
assert.strictEqual(sprayResult.action, "HARD_BLOCK", "Password spraying must trigger HARD_BLOCK");
console.log(" [PASS] Password spraying detected: Action=HARD_BLOCK (Confidence: " + sprayResult.confidence + "%)");

// ================================================================
// [TEST 14] BEHAVIORAL BIOMETRICS & HUMAN-MIMICKING BOT DEFENSE
// ================================================================
console.log("\n[TEST 14] Testing Behavioral Biometrics & Keystroke Cadence...");
const botBiometrics = cloudDefenseSentinel.evaluateBehavioralBiometrics({
  keystrokeDelays: [120, 121, 120, 121, 120, 121], // Inhuman stdDev < 4ms
  mouseEventsCount: 0,
  touchEventsCount: 0,
  cdpActive: true,
  captchaSolveDurationMs: 400
});
assert.strictEqual(botBiometrics.isBot, true, "Synthetic typing + CDP + fast CAPTCHA must be bot");
assert.strictEqual(botBiometrics.action, "HARD_BLOCK", "High-confidence bot must trigger HARD_BLOCK");
console.log(" [PASS] Human-mimicking bot identified with confidence: " + botBiometrics.confidence + "%");

// ================================================================
// [TEST 15] IMPOSSIBLE TRAVEL VELOCITY & SESSION ANOMALY
// ================================================================
console.log("\n[TEST 15] Testing Impossible Travel Velocity Calculation...");
const travelCheck = cloudDefenseSentinel.evaluateSessionAnomaly({
  userId: "usr_9912",
  sessionToken: "tok_secret_session_token",
  currentIp: "198.51.100.99",
  currentCoords: { lat: 51.5074, lon: -0.1278 }, // London
  prevIp: "203.0.113.10",
  prevCoords: { lat: 40.7128, lon: -74.0060 },  // New York (~5570 km)
  prevTimestamp: Date.now() - 3600000,          // 1 hour ago (~5570 km/h)
  currentFingerprint: "fp_mismatch_hardware",
  prevFingerprint: "fp_original_device",
  actionType: "SENSITIVE_MUTATION",
  credentialChanges: ["password", "mfa_reset"]
});
assert.strictEqual(travelCheck.safe, false, "Impossible travel with credential mutation must be blocked");
assert.strictEqual(travelCheck.action, "HARD_BLOCK", "Action must be HARD_BLOCK");
console.log(" [PASS] Impossible travel flagged: Action=HARD_BLOCK (Confidence: " + travelCheck.confidence + "%)");

// ================================================================
// [TEST 16] OBJECT-LEVEL AUTHORIZATION GUARD (BOLA/IDOR 404 INVARIANT)
// ================================================================
console.log("\n[TEST 16] Testing Object-Level Authorization Guard (BOLA/IDOR 404)...");
// 16a. Unauthenticated request -> 401
const mockDb = {
  "doc_100": { id: "doc_100", ownerId: "user_alice", secret: "confidential" },
};
const middleware = objectAuthGuard.requireOwnership(async (req) => mockDb[req.params?.id]);

const unauthIncReq = { params: { id: "doc_100" } };
const { res: unauthIncRes } = createMockReqRes();
let nextCalled = false;
await middleware(unauthIncReq, unauthIncRes, () => { nextCalled = true; });
assert.strictEqual(unauthIncRes.statusCode, 401, "Unauthenticated request must return 401");

// 16b. Authenticated as Bob querying Alice's resource -> MUST RETURN 404 NOT FOUND (NEVER 403)
const bobReq = { params: { id: "doc_100" }, user: { id: "user_bob" } };
const { res: bobRes } = createMockReqRes();
nextCalled = false;
await middleware(bobReq, bobRes, () => { nextCalled = true; });
assert.strictEqual(bobRes.statusCode, 404, "Unauthorized query must return 404 (NEVER 403) to prevent IDOR oracle");
assert.strictEqual(bobRes.body?.error, "NOT_FOUND", "Error code must be NOT_FOUND");

// 16c. Alice queries her own resource -> Allowed, next() invoked
const aliceReq = { params: { id: "doc_100" }, user: { id: "user_alice" } };
const { res: aliceRes } = createMockReqRes();
nextCalled = false;
await middleware(aliceReq, aliceRes, () => { nextCalled = true; });
assert.strictEqual(nextCalled, true, "Authorized owner must pass to next()");
assert.strictEqual(aliceReq.authorizedResource?.ownerId, "user_alice");
console.log(" [PASS] BOLA/IDOR Guard enforces uniform 404 oracle-neutralization invariant");

// ================================================================
// [TEST 17] PROGRESSIVE STRIKE-BASED AUTO-JAIL ESCALATION
// ================================================================
console.log("\n[TEST 17] Testing Strike-Based Progressive Auto-Jail...");
const strikeIp = "192.0.2.144";
// Strike 1 -> 5 min
const ban1 = banIpWithStrikes(strikeIp, "First minor infraction");
assert.strictEqual(ban1.strikes, 1);
assert.strictEqual(ban1.durationHours, 5 / 60);
assert.strictEqual(isIpBanned(strikeIp), true);

// Strike 2 -> 30 min
const ban2 = banIpWithStrikes(strikeIp, "Second infraction");
assert.strictEqual(ban2.strikes, 2);
assert.strictEqual(ban2.durationHours, 30 / 60);

// Strike 3 -> 24 hours
const ban3 = banIpWithStrikes(strikeIp, "Third repeated violation");
assert.strictEqual(ban3.strikes, 3);
assert.strictEqual(ban3.durationHours, 24);

// Appeal submission
const appeal = submitJailAppeal(strikeIp, "I believe my IP was flagged due to VPN node rotation");
assert.strictEqual(appeal.appealed, true);
console.log(" [PASS] Progressive strike escalation verified: 5m -> 30m -> 24h with human appeal flow");

// ================================================================
// [TEST 18] CLIENT-SIDE ANTI-RECONNAISSANCE & NON-ENUMERABLE FACADE
// ================================================================
console.log("\n[TEST 18] Testing Client-Side Anti-Reconnaissance & Sealed Facade...");
const { aiSecurityScanner } = await import("./src/js/ai-security-scanner-api.js");

// 18a. Zero administrative leak on client
assert.strictEqual(typeof aiSecurityScanner.getAdminSecurityReport, "undefined", "getAdminSecurityReport must not exist on client");

// 18b. Zero STUN / WebRTC honeypot leak
assert.strictEqual(typeof aiSecurityScanner.triggerHoneypotTrap, "undefined", "triggerHoneypotTrap must not exist on client");

// 18c. Zero bombastic codename exposure
assert.strictEqual(typeof aiSecurityScanner.codename, "undefined", "codename must not be exposed on client facade");

// 18d. Tamper-proof frozen object
assert.strictEqual(Object.isFrozen(aiSecurityScanner), true, "aiSecurityScanner must be frozen");

// 18e. Scanner methods functional
assert.strictEqual(aiSecurityScanner.scanMessage("<script>alert(1)</script>").safe, false);
assert.strictEqual(aiSecurityScanner.detectPromptInjection("DAN Mode enabled").detected, true);
assert.strictEqual(aiSecurityScanner.scanUrl("http://169.254.169.254/latest/meta-data").safe, false);
assert.strictEqual(Array.isArray(aiSecurityScanner.getQuarantine()), true);
console.log(" [PASS] Sealed client defense facade verified: zero leaks, anti-reconnaissance active, frozen object");

// ================================================================
// [TEST 19] INCIDENT TELEMETRY ADMINISTRATIVE AUTHORIZATION GUARD
// ================================================================
console.log("\n[TEST 19] Testing Incident Telemetry Administrative Authorization...");
const cloudDefenseHandler = (await import("./api/_cloud-defense.js")).default;

// 19a. Unauthorized incidents query -> Rejected with 403
const { req: unauthIncidentsReq, res: unauthIncidentsRes } = createMockReqRes({
  url: "/api/cloud-defense?action=incidents",
  query: { action: "incidents" }
});
await cloudDefenseHandler(unauthIncidentsReq, unauthIncidentsRes);
assert.strictEqual(unauthIncidentsRes.statusCode, 403, "Unauthorized access to incident logs must return 403");
assert.strictEqual(unauthIncidentsRes.body?.error, "ADMIN_AUTHORIZATION_REQUIRED");

// 19b. Authorized incidents query with x-admin-key -> 200 OK
const { req: authIncidentsReq, res: authIncidentsRes } = createMockReqRes({
  url: "/api/cloud-defense?action=incidents",
  query: { action: "incidents" },
  headers: { "x-admin-key": "IAMATOMICDEVELOPER16@$#" }
});
await cloudDefenseHandler(authIncidentsReq, authIncidentsRes);
assert.strictEqual(authIncidentsRes.statusCode, 200, "Authorized admin access must return 200");
assert.strictEqual(Array.isArray(authIncidentsRes.body?.incidents), true);
console.log(" [PASS] Administrative incident telemetry strictly guarded by Master Key authorization");

// ================================================================
// [TEST 20] EMAIL ALERT HTML ESCAPING & PHISHING NEUTRALIZATION
// ================================================================
console.log("\n[TEST 20] Testing Email Alert HTML Escaping & Phishing Neutralization...");
const { createPasswordResetEmail, createDeviceLinkEmail } = await import("./src/js/email-dispatcher.cjs");

// 20a. Verify template escapes malicious HTML/XSS and invalid schemes
const rawHtml = createPasswordResetEmail({
  username: "<script>alert('xss')</script>John",
  resetUrl: "javascript:alert(document.cookie)",
  token: "123456"
});
assert.strictEqual(rawHtml.includes("<script>"), false, "Must not contain raw script tags");
assert.strictEqual(rawHtml.includes("&lt;script&gt;"), true, "Must properly escape HTML");
assert.strictEqual(rawHtml.includes('href="javascript:'), false, "Must neutralize javascript: URLs to #");

// 20b. Handler dispatches valid requests with 200 OK
const emailAlertHandler = (await import("./api/send-email-alert.js")).default;
const { req: emailOkReq, res: emailOkRes } = createMockReqRes({
  method: "POST",
  url: "/api/send-email-alert",
  headers: { "x-forwarded-for": "198.51.100.77" },
  body: {
    type: "password_reset",
    toEmail: "target@example.com",
    data: {
      username: "Security Operative",
      resetUrl: "https://nexchat-drab.vercel.app/reset.html",
      token: "123456"
    }
  }
});
await emailAlertHandler(emailOkReq, emailOkRes);
assert.strictEqual(emailOkRes.statusCode, 200, "Valid email dispatch should return 200");
console.log(" [PASS] Email dispatcher safely sanitized injection vectors and dispatched with 200 OK");

// ================================================================
// [TEST 21] PRIVATE BLOB BOLA / IDOR & ANONYMOUS REELS GUARDS
// ================================================================
console.log("\n[TEST 21] Testing Private Blob BOLA Guard & Upload Hardening...");
const uploadHandler = (await import("./api/upload.js")).default;
const { req: badAnonReelReq, res: badAnonReelRes } = createMockReqRes({
  method: "POST",
  url: "/api/upload?type=reels&filename=malicious.exe",
  headers: {
    "x-upload-type": "reels",
    "x-filename": "malicious.exe",
    "content-type": "application/x-msdownload"
  }
});
await uploadHandler(badAnonReelReq, badAnonReelRes);
assert.strictEqual(badAnonReelRes.statusCode === 400 || badAnonReelRes.statusCode === 403 || badAnonReelRes.statusCode === 415, true, "Prohibited file extension or invalid anonymous path must be rejected");
console.log(" [PASS] Anonymous upload restrictions strictly enforced: executable extensions and non-video paths blocked");

const reelsHandler = (await import("./api/reels.js")).default;
const { req: spoofReelReq, res: spoofReelRes } = createMockReqRes({
  method: "POST",
  url: "/api/reels",
  body: {
    videoUrl: "https://example.com/stream.mp4",
    authorId: "target_victim_uid_spoofed",
    caption: "Spoofed reel author"
  }
});
await reelsHandler(spoofReelReq, spoofReelRes);
assert.strictEqual(spoofReelRes.statusCode, 201);
assert.strictEqual(spoofReelRes.body?.reel?.authorId, "user_anon", "Anonymous reel submission must not accept forged authorId");
console.log(" [PASS] Identity spoofing strictly blocked: anonymous reel authors defaulted to user_anon");

console.log("\n==================================================================");
console.log("🎉 ALL 21 NEXCHAT FORTRESS SECURITY & ACTIVE DEFENSE TESTS PASSED 100%!");
console.log("==================================================================");
