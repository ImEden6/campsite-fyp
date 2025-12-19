const axios = require('axios');

async function testAPI() {
  try {
    // First login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@campsite.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.accessToken;
    console.log('✓ Login successful, got token');

    // Now fetch bookings
    const bookingsResponse = await axios.get('http://localhost:5000/api/v1/bookings', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('\n✓ Bookings API Response:');
    console.log('Success:', bookingsResponse.data.success);
    console.log('Count:', bookingsResponse.data.count);
    console.log('Data length:', bookingsResponse.data.data?.length);
    
    if (bookingsResponse.data.data && bookingsResponse.data.data.length > 0) {
      console.log('\nFirst booking:');
      const first = bookingsResponse.data.data[0];
      console.log('  Booking Number:', first.bookingNumber);
      console.log('  Check-in Date:', first.checkInDate);
      console.log('  Check-in Date Type:', typeof first.checkInDate);
      console.log('  Check-out Date:', first.checkOutDate);
      console.log('  Status:', first.status);
      console.log('  Site:', first.site?.name);
      console.log('  User:', first.user?.firstName, first.user?.lastName);
      console.log('  Guests:', JSON.stringify(first.guests));
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPI();
