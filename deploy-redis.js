const fs = require("fs");
const Redis = require('ioredis');

// Create a Redis client
const redis = new Redis();

// Function to read the JSON file and store data in Redis
const storeCitiesInRedis = () => {
    fs.readFile('src/models/cities.json', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        try {
            // Parse JSON data
            const cities = JSON.parse(data);

            // Store cities data in Redis
            await redis.set('cities', JSON.stringify(cities));

            console.log('Cities data successfully stored in Redis.');
        } catch (error) {
            console.error('Error parsing or storing cities data in Redis:', error);
        }
    });
};

// Call the function to store cities in Redis
storeCitiesInRedis();
