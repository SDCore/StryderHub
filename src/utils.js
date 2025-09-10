const emotes = require(`./data/${emoteFile(process.env.DEBUG)}Emotes.json`);

function emoteFile(debug) {
	if (debug === 'true') return 'dev';

	return 'prod';
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
			case 'Partly Cloudy':
				return emotes.partlyCloudyDay;
			case 'Mostly Cloudy':
				return emotes.mostlyCloudyDay;
			default:
				return emotes.clearDay;
		}

	switch (condition) {
		case 'Clear':
			return emotes.clearNight;
		case 'Partly Cloudy':
			return emotes.partlyCloudyNight;
		case 'Mostly Cloudy':
			return emotes.mostlyCloudyNight;
		default:
			return emotes.clearNight;
	}
}

module.exports = { emoteFile, conditionText, currentConditionEmote };
