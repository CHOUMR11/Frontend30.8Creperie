// Test the backend API to see what data exists

const API_URL = 'https://backendmenu-3.onrender.com';

async function testBackend() {
  console.log('--- Testing Menu API ---');
  try {
    const menuRes = await fetch(`${API_URL}/api/menu`);
    console.log('Menu status:', menuRes.status);
    const menuData = await menuRes.json();
    console.log('Menu response type:', typeof menuData, Array.isArray(menuData) ? 'array' : '');
    if (Array.isArray(menuData)) {
      console.log('Menu items count:', menuData.length);
      if (menuData.length > 0) {
        console.log('First menu item keys:', Object.keys(menuData[0]));
        console.log('First menu item:', JSON.stringify(menuData[0], null, 2));
      }
    } else if (menuData.data) {
      console.log('Menu items count:', menuData.data.length);
      if (menuData.data.length > 0) {
        console.log('First menu item keys:', Object.keys(menuData.data[0]));
        console.log('First menu item:', JSON.stringify(menuData.data[0], null, 2));
      }
    } else {
      console.log('Menu raw response:', JSON.stringify(menuData, null, 2).slice(0, 500));
    }
  } catch (err) {
    console.error('Menu error:', err.message);
  }

  console.log('\n--- Testing Orders API ---');
  try {
    const ordersRes = await fetch(`${API_URL}/api/orders`);
    console.log('Orders status:', ordersRes.status);
    const ordersData = await ordersRes.json();
    console.log('Orders response type:', typeof ordersData, Array.isArray(ordersData) ? 'array' : '');
    if (Array.isArray(ordersData)) {
      console.log('Orders count:', ordersData.length);
      if (ordersData.length > 0) {
        console.log('First order keys:', Object.keys(ordersData[0]));
        console.log('First order:', JSON.stringify(ordersData[0], null, 2));
        if (ordersData.length > 1) {
          console.log('Second order:', JSON.stringify(ordersData[1], null, 2));
        }
      }
    } else if (ordersData.data) {
      console.log('Orders count:', ordersData.data.length);
      if (ordersData.data.length > 0) {
        console.log('First order keys:', Object.keys(ordersData.data[0]));
        console.log('First order:', JSON.stringify(ordersData.data[0], null, 2));
      }
    } else {
      console.log('Orders raw response:', JSON.stringify(ordersData, null, 2).slice(0, 1000));
    }
  } catch (err) {
    console.error('Orders error:', err.message);
  }

  console.log('\n--- Testing Bills API ---');
  try {
    const billsRes = await fetch(`${API_URL}/api/bills`);
    console.log('Bills status:', billsRes.status);
    const billsData = await billsRes.json();
    console.log('Bills response type:', typeof billsData, Array.isArray(billsData) ? 'array' : '');
    if (Array.isArray(billsData)) {
      console.log('Bills count:', billsData.length);
      if (billsData.length > 0) {
        console.log('First bill keys:', Object.keys(billsData[0]));
        console.log('First bill:', JSON.stringify(billsData[0], null, 2));
      }
    } else {
      console.log('Bills raw response:', JSON.stringify(billsData, null, 2).slice(0, 1000));
    }
  } catch (err) {
    console.error('Bills error:', err.message);
  }
}

testBackend();
