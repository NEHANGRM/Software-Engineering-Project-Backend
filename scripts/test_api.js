const BASE_URL = 'http://localhost:5000/api';

async function testBackend() {
    console.log("🚀 Starting Backend Tests...\n");

    const email = `testuser_${Date.now()}@example.com`;
    const password = 'password123';
    let token = '';
    let userId = '';

    // 1. Register
    try {
        console.log(`1️⃣  Registering user: ${email}...`);
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', email, password })
        });
        const regData = await regRes.json();

        if (regRes.status === 201) {
            console.log("✅ Registration Successful:", regData.message);
        } else {
            console.error("❌ Registration Failed:", regData);
            return;
        }
    } catch (e) { console.error("❌ Connection Error:", e.message); return; }

    // 2. Login
    try {
        console.log(`\n2️⃣  Logging in...`);
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();

        if (loginRes.status === 200) {
            console.log("✅ Login Successful");
            token = loginData.token;
            userId = loginData.user.id;
            console.log("🔑 Token received");
        } else {
            console.error("❌ Login Failed:", loginData);
            return;
        }
    } catch (e) { console.error("❌ Error:", e.message); return; }

    // 3. Create Task
    try {
        console.log(`\n3️⃣  Creating a dummy task...`);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const taskRes = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: "Complete Math Assignment",
                description: "Chapter 5 exercises",
                deadline: tomorrow.toISOString(),
                estimatedDuration: 120, // 2 hours
                type: "assignment"
            })
        });
        const taskData = await taskRes.json();

        if (taskRes.status === 201) {
            console.log("✅ Task Created:", taskData.title);
        } else {
            console.error("❌ Task Creation Failed:", taskData);
        }
    } catch (e) { console.error("❌ Error:", e.message); }

    // 4. Generate Study Plan (AI)
    try {
        console.log(`\n4️⃣  Generating AI Study Plan...`);
        const planRes = await fetch(`${BASE_URL}/ai/generate-plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const planData = await planRes.json();

        if (planRes.status === 200) {
            console.log("✅ API Response Received");
            console.log("📋 Plan Summary:", planData.message);
            console.log(`🔹 Generated ${planData.sessions?.length || 0} study sessions.`);
            if (planData.sessions?.length > 0) {
                console.log(`   First session at: ${new Date(planData.sessions[0].startTime).toLocaleString()}`);
            }
        } else {
            console.error("❌ Plan Generation Failed:", planData);
        }
    } catch (e) { console.error("❌ Error:", e.message); }

    console.log("\n✨ Tests Completed.");
}

testBackend();
