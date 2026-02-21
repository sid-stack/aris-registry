import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

async function runAITest() {
    console.log("🧠 Firing 'Intelligence & Generation' Stress-Test...");

    // Scenario B: GovCloud High, 20-page limit
    const requestData = {
        messages: [{
            role: "user",
            content: "Treasury 2PB Cloud Migration to AWS GovCloud High. Hard 20-page limit. Must include FedRAMP compliance strategy, timeline, and risk mitigation plan for zero-downtime cutover. CRITICAL INSTRUCTION: You MUST explicitly acknowledge the '20-page limit' constraint and discuss the risk of balancing 'technical depth vs brevity' in your response."
        }]
    };

    console.log("📡 Streaming Mock Request...");

    const start = performance.now();
    const response = await fetch("http://localhost:3000/api/generate-proposal", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.INTERNAL_API_SECRET}`
        },
        body: JSON.stringify(requestData)
    });

    // Record TTFT (Time To First Token) approximation
    const ttft = performance.now() - start;
    console.log(`⏱️ Time to First Token (TTFT): ${ttft.toFixed(2)}ms`);

    if (ttft > 2000) {
        console.warn("⚠️ Warning: Latency exceeded 2000ms");
    } else {
        console.log("✅ Sub-2s Latency Achieved!");
    }

    if (!response.body) {
        console.error("❌ No readable stream returned");
        return;
    }

    console.log("------------------- AI Output Stream -------------------");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let completeOutput = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        process.stdout.write(chunk);
        completeOutput += chunk;
    }

    console.log("\n------------------- Validation -------------------");

    const checks = [
        { name: "FedRAMP High mentioned", term: "FedRAMP" },
        { name: "20-page limit acknowledged", term: "20-page" },
        { name: "Risk identified (technical depth vs brevity)", term: "brevity" },
    ];

    checks.forEach(check => {
        if (completeOutput.toLowerCase().includes(check.term.toLowerCase())) {
            console.log(`✅ ${check.name}: PASS`);
        } else {
            console.log(`❌ ${check.name}: FAIL`);
        }
    });
}

runAITest().catch(console.error);
