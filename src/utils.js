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

function convertTimeToUnix(string) {
	const today = new Date();

	const fullDateTimeString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${string}`;

	const unixTimestampDate = new Date(fullDateTimeString);

	return `${Math.floor(unixTimestampDate.getTime() / 1000)}\n\n${today}\n\n${today.getFullYear()}\n\n${today.getMonth() + 1}\n\n${today.getDate()}\n\n${unixTimestampDate}`;
}

module.exports = { emoteFile, conditionText, convertTimeToUnix };
