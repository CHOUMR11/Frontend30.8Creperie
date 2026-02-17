const BASE = 'https://backendmenu-3.onrender.com';

async function testEndpoint(path) {
  console.log(`\n===== GET ${path} =====`);
  try {
    const res = await fetch(`${BASE}${path}`);
    console.log(`Status: ${res.status} ${res.statusText}`);
    const contentType = res.headers.get('content-type') || '';
    console.log(`Content-Type: ${contentType}`);
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        console.log(`Response: Array with ${json.length} items`);
        if (json.length > 0) {
          console.log('First item keys:', Object.keys(json[0]).join(', '));
          console.log('First item:', JSON.stringify(json[0], null, 2));
        }
        if (json.length > 1) {
          console.log('Second item:', JSON.stringify(json[1], null, 2));
        }
      } else if (json && typeof json === 'object') {
        console.log('Response keys:', Object.keys(json).join(', '));
        if (json.data && Array.isArray(json.data)) {
          console.log(`json.data: Array with ${json.data.length} items`);
          if (json.data.length > 0) {
            console.log('First item keys:', Object.keys(json.data[0]).join(', '));
            console.log('First item:', JSON.stringify(json.data[0], null, 2));
          }
        } else {
          console.log('Response:', JSON.stringify(json, null, 2).substring(0, 1000));
        }
      }
    } catch (e) {
      console.log('Raw text (first 500 chars):', text.substring(0, 500));
    }
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
  }
}

async function main() {
  console.log('Testing backend at:', BASE);
  await testEndpoint('/api/orders');
  await testEndpoint('/api/menu');
  await testEndpoint('/api/bills');
  await testEndpoint('/api/commandes');
}

main();
