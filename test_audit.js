import { Blob } from 'node:buffer';

async function test() {
   const dummyPdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n", "utf8");
   const blob = new Blob([dummyPdf], { type: 'application/pdf' });

   const form = new FormData();
   form.append('file', blob, 'dummy.pdf');

   const url = process.argv[2] || 'http://localhost:8080/api/audit';
   console.log(`🚀 Testing target: ${url}`);

   try {
       // 1. Quick Health Check
       const healthUrl = url.replace('/audit', '/health');
       const health = await fetch(healthUrl);
       if (health.ok) console.log("✅ Health Check: OK");
       else console.warn("⚠️ Health Check Failed:", health.status);

       // 2. Run Audit
       const res = await fetch(url, {
           method: 'POST',
           body: form,
       });
       console.log("Status:", res.status);
       const data = await res.json();
       console.log(data);
   } catch(e) {
       console.error("Fetch Error:", e);
   }
}
test();
