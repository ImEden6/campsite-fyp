const axios = require('axios');

async function test() {
  try {
    // Login
    const login = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@campsite.com',
      password: 'admin123'
    });
    
    const token = login.data.data.accessToken;
    
    // Get bookings
    const bookings = await axios.get('http://localhost:5000/api/v1/bookings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✓ API returned', bookings.data.count, 'bookings');
    console.log('\nFirst 3 bookings:');
    bookings.data.data.slice(0, 3).forEach(b => {
      console.log(`  ${b.bookingNumber}: ${b.checkInDate} to ${b.checkOutDate} [${b.status}]`);
      console.log(`    Site: ${b.site?.name}, User: ${b.user?.firstName} ${b.user?.lastName}`);
      console.log(`    Guests: ${JSON.stringify(b.guests)}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response:', err.response.data);
    }
  }
}

test();
