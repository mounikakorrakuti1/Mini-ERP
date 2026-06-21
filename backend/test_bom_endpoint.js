const http = require('http');

// Get a token by logging in as admin
const loginData = JSON.stringify({
  loginId: 'admin',
  password: 'Password1!'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const response = JSON.parse(body);
    const token = response.data?.token;
    if (!token) {
      console.log('Login failed', body);
      return;
    }
    
    // Now get BOMs
    http.get('http://localhost:3000/bom', {
      headers: { 'Authorization': `Bearer ${token}` }
    }, (resBom) => {
      let bomBody = '';
      resBom.on('data', d => bomBody += d);
      resBom.on('end', () => {
        const boms = JSON.parse(bomBody).data;
        if (!boms || boms.length === 0) {
           console.log('No BOMs found');
           return;
        }
        const bom = boms[0];
        console.log('Testing PATCH on BOM:', bom.id);
        
        const patchData = JSON.stringify({
          finishedProductId: bom.finishedProductId,
          referenceQty: 5,
          items: bom.items.map(i => ({ productId: i.productId, quantity: 10 })),
          operations: bom.operations.map(o => ({ name: 'Test Op 2', expectedMinutes: 30 }))
        });
        
        const patchReq = http.request({
          hostname: 'localhost',
          port: 3000,
          path: `/bom/${bom.id}`,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(patchData),
            'Authorization': `Bearer ${token}`
          }
        }, (resPatch) => {
          let patchBody = '';
          resPatch.on('data', d => patchBody += d);
          resPatch.on('end', () => {
            console.log('PATCH Response:', patchBody);
          });
        });
        patchReq.write(patchData);
        patchReq.end();
      });
    });
  });
});

req.write(loginData);
req.end();
