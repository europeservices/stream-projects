import axios from "https://cdn.jsdelivr.net/npm/axios@1.13.2/dist/esm/axios.js";

/**
 * Weather type translations
 */
const weatherTypes = {
    dry: "Klarer Himmel",
    fog: "Nebel",
    rain: "Regen",
    sleet: "Schneeregen",
    snow: "Schnee",
    hail: "Hagel",
    thunderstorm: "Gewitter",
    cloudy: "Bewölkt",
    null: "Unbekannt"
};

/**
 * Retrieve coordinates for a given city name
 * @param cityname
 * @return {Promise<{status: string}|{status: string, lat: *, lon: *}>}
 */
async function retrieveCoordinates(cityname) {
    console.log(cityname);
    const data = await axios.get("https://nominatim.openstreetmap.org/search?q=" + cityname + "&format=jsonv2");
    if (data) {
        const geojson = data.data;
        if (!geojson || geojson.length === 0) {
            return {status: "error"};
        }
        return {
            status: "success",
            lat: geojson[0].lat,
            lon: geojson[0].lon
        };
    }
    return {status: "error"};
}


/**
 * Clear results div
 * @returns {void}
 */
function clearResults() {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
}

/**
 * Handle form submission
 * @param event
 * @returns {Promise<void>}
 */
async function onSubmit(event) {
    event.preventDefault();
    const cityname = document.getElementById("cityName").value;
    const coordinates = await retrieveCoordinates(cityname);
    if (coordinates.status === "success") {
        const weatherData = await retrieveWeatherData(coordinates.lat, coordinates.lon);
        const windSpeedKmH = weatherData.windSpeed * 1.852;
        const tempC = weatherData.temperature.toString().split(".")[0];

        clearResults();

        const heading = document.createElement("h2");
        heading.textContent = `Ergebnisse für ${cityname}`;

        const temperature = document.createElement("p");
        temperature.innerHTML = `<strong>Temperatur</strong>: ${tempC}°C`;

        const humidity = document.createElement("p");
        humidity.innerHTML = `<strong>Luftfeuchtigkeit</strong>: ${weatherData.humidity} %`;

        const feelLikeTemp = document.createElement("p");
        feelLikeTemp.innerHTML = getFeelLikeTemperatureText(tempC, weatherData.humidity, windSpeedKmH);

        const wind = document.createElement("p");
        wind.innerHTML = `<strong>Wind</strong>: ${windSpeedKmH.toFixed(0)} Km/h aus ${weatherData.windDirection.toFixed(0)} Grad`;

        const condition = document.createElement("p");
        condition.innerHTML = `<strong>Wetterlage</strong>: ${weatherTypes[getWeatherCondition(weatherData.condition, weatherData.cloudCoverage)]}`;

        appendToResults([heading, temperature, humidity, feelLikeTemp, wind, condition]);
    } else {
        clearResults();
        const errorMessage = document.createElement("p");
        errorMessage.textContent = "Fehler bei der Ermittlung des Wetters für die angegebene Stadt.";
        appendToResults([errorMessage]);
    }
}

/**
 * Determine weather condition based on API condition and cloud coverage
 * @param condition {string}
 * @param cloudCoverage {number}
 * @returns {string}
 */
function getWeatherCondition(condition, cloudCoverage) {
    if (condition === "dry") {
        if (cloudCoverage >= 75) {
            return "cloudy";
        }
        return "dry";
    }
    return condition;
}


/**
 * Append elements to results div
 * @param elements {HTMLElement[]}
 */
function appendToResults(elements) {
    const resultsDiv = document.getElementById("results");
    elements.forEach(element => resultsDiv.appendChild(element));
}

/**
 * Get feel-like temperature text based on actual temperature, humidity and wind speed
 * @param tempC {number} - Temperature in °C
 * @param humidity {number} - Relative humidity in %
 * @param windKmH {number} - Wind speed in km/h
 * @returns {string} - Formatted feel-like temperature text
 */
function getFeelLikeTemperatureText(tempC, humidity, windKmH) {
    if (tempC >= 10 || windKmH <= 4) {
        return `<strong>Gefühlte Temperatur</strong>: ${heatIndex(tempC, humidity)} °C`
    }
    return `<strong>Gefühlte Temperatur</strong>: ${windchill(tempC, windKmH)} °C`;
}

/**
 * Calculate windchill via formula from NOAA
 * @param tempC {number} - Temperature in °C
 * @param windKmH {number} - Wind speed in km/h
 * @returns number - feel-like temperature in °C or original temperature if above 10°C or wind speed below 4 km/h
 */
function windchill(tempC, windKmH) {
    if (tempC >= 10 || windKmH <= 4) {
        return tempC;
    }

    const v16 = Math.pow(windKmH, 0.16);
    const twc = 13.12 + 0.6215 * tempC - 11.37 * v16 + 0.3965 * tempC * v16;

    return Math.round(twc * 10) / 10;
}

/**
 * Calculate heat index via formula from NOAA
 * @param tempC {number} - Temperature in °C
 * @param humidity {number} - Relative humidity in %
 * @returns number - Heat index in °C or original temperature if below 27°C
 */
function heatIndex(tempC, humidity) {
    if (tempC < 27) {
        return tempC;
    }

    const tempF = (tempC * 9) / 5 + 32;
    const tempFPow2 = Math.pow(tempF, 2);
    const humidityPow2 = Math.pow(humidity, 2);

    const hiF = -42.379 + 2.04901523 * tempF + 10.14333127 * humidity -
        0.22475541 * tempF * humidity - 6.83783 * Math.pow(10, -3) *
        tempFPow2 - 5.481717 * Math.pow(10, -2) *
        humidityPow2 + 1.22874 * Math.pow(10, -3) *
        tempFPow2 * humidity + 8.5282 * Math.pow(10, -4) *
        tempF * humidityPow2 - 1.99 * Math.pow(10, -6) *
        tempFPow2 * humidityPow2;

    const hiC = (hiF - 32) * 5 / 9;
    return Math.round(hiC * 10) / 10;
}

/**
 * Retrieve weather data from Brightsky API
 * @param lat
 * @param lon
 * @returns {Promise<{status: string}|{status: string, temperature: number, condition: number, windSpeed: number, windDirection: number, humidity: number, cloudCoverage: number}>}
 */
async function retrieveWeatherData(lat, lon) {
    const data = await axios.get("https://api.brightsky.dev/current_weather?lat=" + lat + "&lon=" + lon);
    if (data) {
        const weatherData = data.data;
        return {
            status: "success",
            temperature: weatherData.weather.temperature,
            condition: weatherData.weather.condition,
            windSpeed: weatherData.weather.wind_speed_60,
            windDirection: weatherData.weather.wind_direction_60,
            humidity: weatherData.weather.relative_humidity,
            cloudCoverage: weatherData.weather.cloud_cover
        };
    }
    return {status: "error"};
}

window.onSubmit = onSubmit;