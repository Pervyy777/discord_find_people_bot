const Redis = require('ioredis');

// Create a Redis client
const redis = new Redis();

module.exports = async (cityInput) => {
    try {
        // Retrieve JSON data from Redis
        const data = await redis.get('cities');

        // Parse JSON data
        let cities = JSON.parse(data);

        // Function to find cityNameEn based on cityNames
        function findCityNameEn(cityNames) {
            cityNames = cityNames.toLowerCase(); // Convert input to lowercase
            for (const city of cities) {
                if (city.cityNames) { // Check if cityNames is defined
                    const names = city.cityNames.toLowerCase().split(','); // Convert cityNames to lowercase
                    if (names.includes(cityNames)) {
                        return city;
                    }
                }
            }
            return null; // If not found
        }

        // Example usage
        const cityNames = cityInput; // CityNames to search for
        const cityNameEn = findCityNameEn(cityNames);
        if (cityNameEn) {
            console.log(`The English city name for '${cityNames}' is '${cityNameEn.cityNameEn}'.`);
            return cityNameEn;
        } else {
            console.log(`City name not found for '${cityNames}'.`);
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        throw new Error('Error retrieving city data from Redis');
    }
};
