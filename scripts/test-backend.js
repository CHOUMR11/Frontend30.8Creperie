const https = require('https');

function get(path) {
  return new Promise((resolve, reject) => {
    const url = 'https://backendmenu-3.onrender.com' + path;
    console.log('\n===== GET ' + path + ' =====');
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
          const json = JSON.parse(data);
          if (Array.isArray(json)) {
            console.log('Array with ' + json.length + ' items');
            if (json.length > 0) {
              console.log('First item keys:', Object.keys(json[0]).join(', '));
              console.log('First item:', JSON.stringify(json[0], null, 2));
            }
            if (json.length > 1) {
              console.log('Second item:', JSON.stringify(json[1], null, 2));
            }
          } else if (json && typeof json === 'object') {
            console.log('Object keys:', Object.keys(json).join(', '));
            if (json.data && Array.isArray(json.data)) {
              console.log('json.data: Array with ' + json.data.length + ' items');
              if (json.data.length > 0) {
                console.log('First data item:', JSON.stringify(json.data[0], null, 2));
              }
            } else {
              console.log('Response:', JSON.stringify(json, null, 2).substring(0, 800));
            }
          }
        } catch (e) {
          console.log('Raw (500 chars):', data.substring(0, 500));
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log('ERROR:', err.message);
      resolve();
    });
  });
}

async function main() {
  console.log('Testing backend: https://backendmenu-3.onrender.com');
  await get('/api/orders');
  await get('/api/menu');
  await get('/api/bills');
  await get('/api/commandes');
}

main();
