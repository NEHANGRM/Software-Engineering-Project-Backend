const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login request...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'nehangrm123@gmail.com',
            password: 'password123' // Replace with proper test assumption or just test failure state
        });
        console.log('Success response:', response.data);
    } catch (e) {
        if (e.response) {
            console.error('Error response:', e.response.status, e.response.data);
        } else {
            console.error('Error:', e.message);
        }
    }
}
testLogin();
