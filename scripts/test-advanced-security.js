const assert = require("assert");

async function runTests() {
  console.log("=== SCANBITE ADVANCED SECURITY TEST SUITE ===");
  const baseUrl = "http://localhost:3000/api/auth";

  // TEST 1: Password Login & Normal Session
  console.log("\n[Test 1] Regular Password Login for grand-spice...");
  const loginRes = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", identifier: "grand-spice", password: "admin123" }),
  });
  const loginData = await loginRes.json();
  const setCookieHeader = loginRes.headers.get("set-cookie") || "";
  console.log("  Login result:", { success: loginData.success, require2FA: loginData.require2FA });
  assert(loginRes.ok && (loginData.success || loginData.require2FA), "Login should succeed or prompt 2FA");

  // Extract cookie if returned
  let cookie = "";
  if (setCookieHeader) {
    const match = setCookieHeader.match(/scanbite_auth_token=([^;]+)/);
    if (match) cookie = match[1];
  }

  // TEST 2: Toggle WhatsApp 2FA ON
  console.log("\n[Test 2] Toggle WhatsApp 2FA ON...");
  // If we don't have cookie yet because 2FA was already on or demo login:
  if (!cookie) {
    const demoRes = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "demo_login" }),
    });
    const m = (demoRes.headers.get("set-cookie") || "").match(/scanbite_auth_token=([^;]+)/);
    if (m) cookie = m[1];
  }

  const toggleRes = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `scanbite_auth_token=${cookie}` },
    body: JSON.stringify({ action: "toggle_2fa", enabled: true }),
  });
  const toggleData = await toggleRes.json();
  console.log("  2FA Toggle result:", toggleData);
  assert(toggleData.twoFactorEnabled === true, "2FA should be enabled");

  // TEST 3: Login with 2FA Challenge Triggered
  console.log("\n[Test 3] Attempt Login with 2FA Enabled...");
  const login2FaRes = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", identifier: "grand-spice", password: "admin123" }),
  });
  const login2FaData = await login2FaRes.json();
  console.log("  2FA Challenge response:", {
    require2FA: login2FaData.require2FA,
    phoneMasked: login2FaData.phoneMasked,
    hasWaUrl: !!login2FaData.waUrl,
    demoOtp: login2FaData.demoOtp,
  });
  assert(login2FaData.require2FA === true, "Must require 2FA OTP");
  assert(login2FaData.demoOtp, "Must generate 6-digit OTP");
  assert(login2FaData.waUrl.includes("wa.me"), "Must generate wa.me link");

  // TEST 4: Invalid OTP Attempt
  console.log("\n[Test 4] Submitting invalid OTP (000000)...");
  const badOtpRes = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify_2fa", identifier: "grand-spice", otp: "000000" }),
  });
  const badOtpData = await badOtpRes.json();
  console.log("  Bad OTP status:", badOtpRes.status, badOtpData.error);
  assert(badOtpRes.status === 401, "Bad OTP must return 401");

  // TEST 5: Valid OTP Verification
  console.log("\n[Test 5] Submitting valid OTP:", login2FaData.demoOtp);
  const goodOtpRes = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify_2fa", identifier: "grand-spice", otp: login2FaData.demoOtp }),
  });
  const goodOtpData = await goodOtpRes.json();
  const goodCookie = (goodOtpRes.headers.get("set-cookie") || "").match(/scanbite_auth_token=([^;]+)/)?.[1];
  console.log("  Valid OTP status:", goodOtpRes.status, "User authenticated:", goodOtpData.user?.slug);
  assert(goodOtpRes.ok && goodOtpData.success, "2FA verification must succeed");
  assert(goodCookie, "Must set session cookie");

  // TEST 6: Multi-Device Instant Session Revocation
  console.log("\n[Test 6] Multi-Device Instant Session Revocation...");
  // Step 6a: Check session is active
  const checkRes = await fetch(baseUrl, {
    headers: { Cookie: `scanbite_auth_token=${goodCookie}` },
  });
  const checkData = await checkRes.json();
  console.log("  Pre-revocation session authenticated:", checkData.authenticated);
  assert(checkData.authenticated === true, "Session should be active");

  // Wait 1 second so issued-at timestamp is strictly before revocation timestamp
  await new Promise((r) => setTimeout(r, 1100));

  // Step 6b: Revoke all sessions
  const revokeRes = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `scanbite_auth_token=${goodCookie}` },
    body: JSON.stringify({ action: "revoke_all_sessions" }),
  });
  const revokeData = await revokeRes.json();
  console.log("  Revoke result:", revokeData);
  assert(revokeData.success === true, "Revoke all sessions should succeed");

  // Step 6c: Try using the OLD goodCookie
  const checkAfterRevoke = await fetch(baseUrl, {
    headers: { Cookie: `scanbite_auth_token=${goodCookie}` },
  });
  const checkAfterData = await checkAfterRevoke.json();
  console.log("  Post-revocation check with old token:", checkAfterData);
  assert(checkAfterData.authenticated === false, "Old token MUST be rejected immediately!");

  // TEST 7: Turn 2FA back off so standard demo login remains smooth
  const freshLogin = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "demo_login" }),
  });
  const freshCookie = (freshLogin.headers.get("set-cookie") || "").match(/scanbite_auth_token=([^;]+)/)?.[1];
  await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `scanbite_auth_token=${freshCookie}` },
    body: JSON.stringify({ action: "toggle_2fa", enabled: false }),
  });
  console.log("  Restored 2FA to default state.");

  console.log("\n🎉 ALL ADVANCED SECURITY BACKEND TESTS PASSED 100%!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
