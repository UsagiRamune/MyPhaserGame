// test-api.js
const axios = require('axios');
const API_URL = "https://asia-southeast1-realtimedata-phasergame.cloudfunctions.net/api";

async function runTests() {
  console.log('--- Running API Tests ---');

  // Test Case 1: Submit a valid score
  try {
    const validPayload = { name: "AxiosTester", score: 999 };
    const res = await axios.post(`${API_URL}/submit-score`, validPayload);
    console.log('✅ [PASS] Valid submission:', res.status, res.data.message);
  } catch (err) {
    console.error('❌ [FAIL] Valid submission:', err.response?.status, err.response?.data);
  }

  // Test Case 2: Submit an invalid score (bad input)
  try {
    const invalidPayload = { name: "  ", score: "not-a-number" };
    await axios.post(`${API_URL}/submit-score`, invalidPayload);
     console.error('❌ [FAIL] Invalid submission should have failed but did not.');
  } catch (err) {
    if (err.response?.status === 400) {
        console.log('✅ [PASS] Invalid submission rejected as expected:', err.response.status);
    } else {
        console.error('❌ [FAIL] Invalid submission:', err.response?.status, err.response?.data);
    }
  }

  // Test Case 3: Get the leaderboard
  try {
    const res = await axios.get(`${API_URL}/leaderboard`);
    console.log('✅ [PASS] Get leaderboard:', res.status, `Got ${res.data.length} entries.`);
  } catch(err) {
    console.error('❌ [FAIL] Get leaderboard:', err.response?.status, err.response?.data);
  }

  console.log('--- Tests Finished ---');
}

runTests();