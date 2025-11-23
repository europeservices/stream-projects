import axios from "https://cdn.jsdelivr.net/npm/axios@1.13.2/dist/esm/axios.js";

const weatherTypes = {
    dry: "Klarer Himmel",
    fog: "Nebel",
    rain: "Regen",
    sleet: "Schneeregen",
    snow: "Schnee",
    hail: "Hagel",
    thunderstorm: "Gewitter",
    null: "Unbekannt"
};

async function retrieveCoordinates(cityname) {
    console.log(cityname);
    const data = await axios.get("https://nominatim.openstreetmap.org/search?q=" + cityname + "&format=jsonv2");
    if (data) {
        const geojson = data.data;
        return {status: "success", lat: geojson[0].lat, lon: geojson[0].lon};
    }
    return {status: "error"};
}

async function onSubmit() {
    const cityname = document.getElementById("city-name").value;
    const coordinates = await retrieveCoordinates(cityname);
    if (coordinates.status === "success") {
        const weatherData = await retrieveWeatherData(coordinates.lat, coordinates.lon);
        const windSpeedKmH = weatherData.windSpeed * 1.852;
        const tempC = weatherData.temperature.toString().split(".")[0];
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "";

        const heading = document.createElement("h2");
        heading.textContent = `Ergebnisse für ${cityname}`;

        const temperature = document.createElement("p");
        temperature.innerHTML = `<strong>Temperatur</strong>: ${tempC}°C`;

        const humidity = document.createElement("p");
        humidity.innerHTML = `<strong>Luftfeuchtigkeit</strong>: ${weatherData.humidity} %`;

        const feelLikeTemp = document.createElement("p");
        feelLikeTemp.innerHTML = 11 >= 10 || windSpeedKmH <= 4
            ? `<strong>Gefühlte Temperatur</strong>: ${heatIndex(27, weatherData.humidity)} °C`
            : `<strong>Gefühlte Temperatur</strong>: ${windchill(11, windSpeedKmH)} °C`;

        //TODO: Forecast abbilden

        const wind = document.createElement("p");
        wind.innerHTML = `<strong>Wind</strong>: ${weatherData.windSpeed} Knoten aus ${weatherData.windDirection}°`;

        const condition = document.createElement("p");
        const weatherCondition = weatherData.condition;
        condition.innerHTML = `<strong>Wetterlage</strong>: ${weatherTypes[weatherCondition]}`;

        resultsDiv.appendChild(heading);
        resultsDiv.appendChild(temperature);
        resultsDiv.appendChild(feelLikeTemp);
        resultsDiv.appendChild(humidity);
        resultsDiv.appendChild(wind);
        resultsDiv.appendChild(condition);
    }
}

function windchill(tempC, windKmH) {
    if (tempC >= 10 || windKmH <= 4) {
        return tempC;
    }

    const v16 = Math.pow(windKmH, 0.16);
    const twc = 13.12 + 0.6215 * tempC - 11.37 * v16 + 0.3965 * tempC * v16;

    return Math.round(twc * 10) / 10;
}

function heatIndex(tempC, humidity) {
    if (tempC < 27) {
        return tempC;
    }

    const tempF = (tempC * 9) / 5 + 32;
    const hiF =
        -42.379 + 2.04901523 * tempF + 10.14333127 * humidity -
        0.22475541 * tempF * humidity - 6.83783 * Math.pow(10, -3) *
        Math.pow(tempF, 2) - 5.481717 * Math.pow(10, -2) *
        Math.pow(humidity, 2) + 1.22874 * Math.pow(10, -3) *
        Math.pow(tempF, 2) * humidity + 8.5282 * Math.pow(10, -4) *
        tempF * Math.pow(humidity, 2) - 1.99 * Math.pow(10, -6) *
        Math.pow(tempF, 2) * Math.pow(humidity, 2);

    const hiC = (hiF - 32) * 5 / 9;
    return Math.round(hiC * 10) / 10;
}


async function retrieveWeatherData(lat, lon) {
    const data = await axios.get("https://api.brightsky.dev/current_weather?lat=" + lat + "&lon=" + lon);
    if (data) {
        const weatherData = data.data;
        return {status: "success", temperature: weatherData.weather.temperature, condition: weatherData.weather.condition, windSpeed: weatherData.weather.wind_speed_60, windDirection: weatherData.weather.wind_direction_60, humidity: weatherData.weather.relative_humidity};
    }
    return {status: "error"};
}

window.onSubmit = onSubmit;