const { DateTime } = require('luxon');

const emotes = require(`./data/${emoteFile(process.env.DEBUG)}Emotes.json`);

function emoteFile(debug) {
	if (debug === 'true') return 'dev';

	return 'prod';
}

function checkUnits(units) {
	if (units === 'us') {
		return {
			temperature: 'F',
			wind: 'mph',
		};
	} else if (units === 'ca') {
		return {
			temperature: 'C',
			wind: 'kph',
		};
	} else if (units === 'uk') {
		return {
			temperature: 'C',
			wind: 'mph',
		};
	} else {
		return {
			temperature: 'F',
			wind: 'mph',
		};
	}
}

function forecastDay(day, weather, unit) {
	const date = weather.daily.data[day].time;
	const formattedDate = DateTime.fromSeconds(date).toFormat('MM-dd');

	const dateList = require('./data/dates.json');

	const importantDateText = formattedDate in dateList ? `\n-# ***${dateList[formattedDate].emote} ${dateList[formattedDate].name}***\n` : `\n`;

	const forecastText = `**<t:${weather.daily.data[day].time}:D>** (🌧️ ${weather.daily.data[day].precipProbability.toFixed(1) * 100}%)${importantDateText}-# ${emotes.tempHigh} ${weather.daily.data[
		day
	].temperatureHigh.toFixed(1)}°${unit} / ${emotes.tempLow} ${weather.daily.data[day].temperatureLow.toFixed(1)}°${unit}\n-# ${emotes.sunrise} <t:${weather.daily.data[day].sunriseTime}:t> / ${emotes.sunset} <t:${
		weather.daily.data[day].sunsetTime
	}:t>\n`;

	return forecastText;
}

function conditionText(condition) {
	switch (condition) {
		case 'Partly cloudy':
			return 'Partly Cloudy';
		case 'Patchy rain possible':
			return 'Rain Possible';
		case 'Patchy snow possible':
			return 'Snow Possible';
		case 'Patchy sleet possible':
			return 'Sleet Possible';
		case 'Patchy freezing drizzle possible':
			return 'Freezing Drizzle Possible';
		case 'Thundery outbreaks possible':
			return 'Thunderstorms Possible';
		case 'Blowing snow':
			return 'Blowing Snow';
		case 'Freezing fog':
			return 'Freezing Fog';
		case 'Patchy light drizzle':
			return 'Light Drizzle Possible';
		case 'Light drizzle':
			return 'Light Drizzle';
		case 'Freezing drizzle':
			return 'Freezing Drizzle';
		case 'Heavy freezing drizzle':
			return 'Heavy Freezing Drizzle';
		case 'Patchy light rain':
			return 'Light Rain Possible';
		case 'Light rain':
			return 'Light Rain';
		case 'Moderate rain at times':
			return 'Rain Possible';
		case 'Moderate rain':
			return 'Rain';
		case 'Heavy rain at times':
			return 'Heavy Rain Possible';
		case 'Heavy rain':
			return 'Heavy Rain';
		default:
			return condition;
	}
}

function currentConditionEmote(time, condition) {
	if (time)
		switch (condition) {
			case 'Sunny':
				return emotes.clearDay;
			case 'Breezy':
				return emotes.breezyDay;
			case 'Partly Cloudy':
				return emotes.partlyCloudyDay;
			case 'Mostly Cloudy':
				return emotes.mostlyCloudyDay;
			case 'Mostly Clear':
				return emotes.mostlyClearDay;
			case 'Breezy and Mostly Clear':
				return emotes.mostlyClearDay;
			case 'Breezy and Partly Cloudy':
				return emotes.partlyCloudyDay;
			case 'Light Rain':
				return emotes.lightRain;
			case 'Drizzle':
				return emotes.lightRain;
			case 'Rain':
				return emotes.rain;
			case 'Heavy Rain':
				return emotes.heavyRain;
			case 'Light Rain and Breezy':
				return emotes.rainWind;
			case 'Rain and Breezy':
				return emotes.rainWind;
			case 'Heavy Rain and Breezy':
				return emotes.rainWind;
			case 'Humid and Mostly Cloudy':
				return emotes.mostlyCloudyDay;
			case 'Breezy and Mostly Cloudy':
				return emotes.mostlyCloudyDay;
			case 'Overcast':
				return emotes.mostlyCloudyDay;
			case 'Windy and Partly Cloudy':
				return emotes.partlyCloudyWindyDay;
			case 'Breezy and Overcast':
				return emotes.partlyCloudyWindyDay;
			case 'Windy and Overcast':
				return emotes.partlyCloudyWindyDay;
			case 'Windy and Mostly Cloudy':
				return emotes.partlyCloudyWindyDay;
			case 'Flurries':
				return emotes.flurries;
			case 'Flurries and Breezy':
				return emotes.flurries;
			case 'Flurries and Windy':
				return emotes.flurries;
			case 'Light Snow':
				return emotes.flurries;
			case 'Light Snow and Breezy':
				return emotes.flurries;
			default:
				return emotes.clearDay;
		}

	switch (condition) {
		case 'Clear':
			return emotes.clearNight;
		case 'Breezy':
			return emotes.breezyNight;
		case 'Partly Cloudy':
			return emotes.partlyCloudyNight;
		case 'Mostly Cloudy':
			return emotes.mostlyCloudyNight;
		case 'Mostly Clear':
			return emotes.mostlyClearNight;
		case 'Breezy and Mostly Clear':
			return emotes.mostlyClearNight;
		case 'Breezy and Partly Cloudy':
			return emotes.partlyCloudyNight;
		case 'Light Rain':
			return emotes.lightRain;
		case 'Drizzle':
			return emotes.lightRain;
		case 'Rain':
			return emotes.rain;
		case 'Heavy Rain':
			return emotes.heavyRain;
		case 'Light Rain and Breezy':
			return emotes.rainWind;
		case 'Rain and Breezy':
			return emotes.rainWind;
		case 'Heavy Rain and Breezy':
			return emotes.rainWind;
		case 'Humid and Mostly Cloudy':
			return emotes.mostlyCloudyNight;
		case 'Breezy and Mostly Cloudy':
			return emotes.mostlyCloudyNight;
		case 'Overcast':
			return emotes.mostlyCloudyNight;
		case 'Windy and Partly Cloudy':
			return emotes.partlyCloudyWindyNight;
		case 'Breezy and Overcast':
			return emotes.partlyCloudyWindyNight;
		case 'Windy and Overcast':
			return emotes.partlyCloudyWindyNight;
		case 'Windy and Mostly Cloudy':
			return emotes.partlyCloudyWindyNight;
		case 'Flurries':
			return emotes.flurries;
		case 'Flurries and Breezy':
			return emotes.flurries;
		case 'Flurries and Windy':
			return emotes.flurries;
		case 'Light Snow':
			return emotes.flurries;
		case 'Light Snow and Breezy':
			return emotes.flurries;
		default:
			return emotes.clearNight;
	}
}

module.exports = { emoteFile, checkUnits, forecastDay, conditionText, currentConditionEmote };
