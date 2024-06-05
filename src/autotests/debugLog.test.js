// Import the debugLog function
const debugLog = require('../utils/debugLog');

// Set DEBUG environment variable to true for testing
process.env.DEBUG = true;

// Test the 'i' state
debugLog('i', 'This is an informational message.', ' lol');

// Test the 'w' state
debugLog('w', 'This is a warning message.', ' lol');

// Test the 'e' state
debugLog('e', 'This is an error message.', ' lol');

// Test an invalid state
debugLog('x', 'This is a message for an invalid state.');
