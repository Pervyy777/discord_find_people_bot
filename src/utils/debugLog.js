const fs = require('fs');
const path = require('path');

// Constants for log states and color codes
const LOG_STATES = {
    INFO: 'i',
    WARNING: 'w',
    ERROR: 'e'
};

const COLOR_CODES = {
    RESET: '\x1b[0m',
    WARNING: '\x1b[32m',
    ERROR: '\x1b[31m',
    UNKNOWN: '\x1b[31m'
};

// Helper function to get the current timestamp
const getTimestamp = () => new Date().toISOString(); // Formats as YYYY-MM-DDTHH:mm:ss.sssZ

// Helper function to append log messages to a file
const logToFile = (message) => {
    const logFilePath = path.join(__dirname, '../../console.log');
    fs.appendFileSync(logFilePath, message + '\n', 'utf8');
};

// Helper function to format log messages
const formatLogMessage = (state, args) => {
    const timestamp = getTimestamp();
    switch(state) {
        case LOG_STATES.INFO:
            return `${COLOR_CODES.RESET}${timestamp} INFO: ${args.join(' ')}`;
        case LOG_STATES.WARNING:
            return `${COLOR_CODES.WARNING}${timestamp} WARNING: ${args.join(' ')}${COLOR_CODES.RESET}`;
        case LOG_STATES.ERROR:
            return `${COLOR_CODES.ERROR}${timestamp} ERROR: ${args.join(' ')}${COLOR_CODES.RESET}`;
        default:
            return `${COLOR_CODES.UNKNOWN}${timestamp} UNKNOWN: the state "${state}" for debugLog is not found. Message: ${args.join(' ')}${COLOR_CODES.RESET}`;
    }
};

// Main logging function
module.exports = (state, ...args) => {
    const message = formatLogMessage(state, args);
    
    if (process.env.DEBUG) {
        console.log(message);
    }
    
    // Remove color codes for file logging
    const plainMessage = message.replace(/\x1b\[\d+m/g, '');
    logToFile(plainMessage);
};
