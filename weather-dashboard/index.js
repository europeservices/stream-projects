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

        const resultsDiv = document.getElementById("results");

        const heading = document.createElement("h2");
        heading.textContent = `Ergebnisse für ${cityname}`;

        const temperature = document.createElement("p");
        temperature.innerHTML = `<strong>Temperatur</strong>: ${weatherData.temperature}°C`;

        //TODO: gefühlte temperatur berechnen
        //TODO: Forecast abbilden

        const wind = document.createElement("p");
        wind.innerHTML = `<strong>Wind</strong>: ${weatherData.windSpeed} Knoten aus ${weatherData.windDirection}°`;

        const condition = document.createElement("p");
        const weatherCondition = weatherData.condition;
        condition.innerHTML = `<strong>Wetterlage</strong>: ${weatherTypes[weatherCondition]}`;

        resultsDiv.appendChild(heading);
        resultsDiv.appendChild(temperature);
        resultsDiv.appendChild(wind);
        resultsDiv.appendChild(condition);
    }
}

async function retrieveWeatherData(lat, lon) {
    const data = await axios.get("https://api.brightsky.dev/current_weather?lat=" + lat + "&lon=" + lon);
    if (data) {
        const weatherData = data.data;
        return {status: "success", temperature: weatherData.weather.temperature, condition: weatherData.weather.condition, windSpeed: weatherData.weather.wind_speed_60, windDirection: weatherData.weather.wind_direction_60};
    }
    return {status: "error"};
}

window.onSubmit = onSubmit;