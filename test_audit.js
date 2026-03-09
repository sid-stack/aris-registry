const fs = require('fs');

async function test() {
   const dummyPdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n", "utf8");
   fs.writeFileSync('dummy.pdf', dummyPdf);

   const FormData = require('form-data');
   const form = new FormData();
   form.append('file', fs.createReadStream('dummy.pdf'));

   try {
       const res = await fetch('http://localhost:3001/api/audit', {
           method: 'POST',
           body: form
       });
       console.log("Status:", res.status);
       const data = await res.json();
       console.log(data);
   } catch(e) {
       console.error("Fetch Error:", e);
   }
}
test();
