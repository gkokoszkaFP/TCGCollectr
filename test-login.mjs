/**
 * Manual test script for login endpoint
 * Run with: node test-login.mjs
 */

const BASE_URL = "http://localhost:3000";

async function testLogin() {
  console.log("🧪 Testing POST /api/auth/login");
  console.log("=".repeat(50));

  // Test 1: Validation error - missing fields
  console.log("\n📝 Test 1: Missing email field");
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "test" }),
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }

  // Test 2: Validation error - invalid email format
  console.log("\n📝 Test 2: Invalid email format");
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        password: "Password123!",
      }),
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }

  // Test 3: Invalid credentials
  console.log("\n📝 Test 3: Invalid credentials");
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "WrongPassword123!",
      }),
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }

  // Test 4: Register a test user first, then login
  console.log("\n📝 Test 4: Register user then login");
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!@#";

  try {
    // Register
    console.log("  → Registering user:", testEmail);
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const registerData = await registerResponse.json();
    console.log(`  → Register status: ${registerResponse.status}`);

    if (registerResponse.status === 201) {
      console.log("  → Registration successful!");

      // Wait a moment for the profile to be created
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Now try to login
      console.log("  → Attempting login...");
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });
      const loginData = await loginResponse.json();
      console.log(`  → Login status: ${loginResponse.status}`);
      console.log("  → Response:", JSON.stringify(loginData, null, 2));

      if (loginResponse.status === 200) {
        console.log("  ✅ Login successful!");
      }
    } else {
      console.log("  ❌ Registration failed:", registerData);
    }
  } catch (error) {
    console.error("  ❌ Error:", error.message);
  }

  // Test 5: Invalid JSON
  console.log("\n📝 Test 5: Invalid JSON");
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json",
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Testing complete!");
}

testLogin();
