const chalk = require('chalk');
const axios = require('axios');
const { DateTime } = require('luxon');
const { Database } = require('bun:sqlite');
const { version } = require('../../../package.json');
const { emoteFile, checkUnits, forecastDay, conditionText, updateTypeText, currentConditionEmote } = require('../../utils.js');
const { ButtonStyle, MessageFlags, ButtonBuilder, ActionRowBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorSpacingSize } = require('discord.js');

const db_settings = new Database(`${__dirname}/../../database/settings.sqlite`);

const importantDates = require(`../../data/dates.json`);
const emotes = require(`../../data/${emoteFile(Bun.env.DEBUG)}Emotes.json`);

const wait = n => new Promise(resolve => setTimeout(resolve, n));

module.exports = {
	name: 'clientReady',
	once: true,
	execute(client) {
		if (Bun.env.ENABLED == 'false') return;

		async function updateHubData() {
			const getSettings = db_settings.prepare('SELECT showForecast, showAPIData, location, units, alerts, updateType, lastUpdated FROM settings WHERE guild_id = ?').get(Bun.env.SERVER_ID);

			const location = getSettings.location;

			const locations = require(`../../data/locations.json`);

			let lat = locations[location].latitude;
			let long = locations[location].longitude;

			const weatherURL = axios.get(`https://api.pirateweather.net/forecast/${Bun.env.WEATHER_API_KEY}/${lat},${long}?units=${getSettings.units}&exclude=minutely,hourly,flags`);
			const geoURL = axios.get(`https://api.geoapify.com/v1/geocode/search?text=${lat},${long}&lang=en&limit=1&format=json&apiKey=${Bun.env.GEO_API_KEY}`);

			await axios
				.all([weatherURL, geoURL])
				.then(
					axios.spread(async (...res) => {
						const weatherData = res[0].data;
						const geoData = res[1].data;
						const apiData = res[0].headers;

						const nowUnix = Math.floor(Date.now() / 1000);

						const nowCondition = conditionText(weatherData.currently.summary);
						const todaySunriseTime = weatherData.daily.data[0].sunriseTime;
						const todaySunsetTime = weatherData.daily.data[0].sunsetTime;

						const isDayTime = nowUnix >= todaySunriseTime && nowUnix < todaySunsetTime ? 1 : 0;

						const getUnits = checkUnits(getSettings.units);

						const date = weatherData.daily.data[0].time;
						const formattedDate = DateTime.fromSeconds(date).toFormat('MM-dd');

						// TODO: Reminders
						// TODO: Shift Tracking

						const hubContainer = new ContainerBuilder();

						const versionText = new TextDisplayBuilder().setContent(`-# **v${version}**`);

						hubContainer.addTextDisplayComponents(versionText);

						const importantDateText = formattedDate in importantDates ? `\n-# ${emotes.listArrow} ***Today is ${importantDates[formattedDate].name}! ${importantDates[formattedDate].emote}***\n` : `\n`;

						const headerText = new TextDisplayBuilder().setContent(
							`# ${currentConditionEmote(isDayTime, nowCondition)} Weather for ${geoData.results[0].city}, ${geoData.results[0].state_code}${importantDateText}-# ${
								emotes.listArrow
							} Conditions are ${nowCondition} as of <t:${weatherData.currently.time}:t>\n-# ${emotes.listArrow} Winds at ${Math.floor(weatherData.currently.windSpeed)} ${
								checkUnits(getSettings.units).wind
							}, with gusts up to ${Math.floor(weatherData.currently.windGust)} ${checkUnits(getSettings.units).wind}`,
						);

						const currentText = new TextDisplayBuilder().setContent(
							`### Current Temperature: ${weatherData.currently.temperature.toFixed(1)}°${checkUnits(getSettings.units).temperature}\n-# 🌡️ Feels Like: ${weatherData.currently.apparentTemperature.toFixed(
								1,
							)}°${checkUnits(getSettings.units).temperature}\n-# ${emotes.tempHigh} High of ${weatherData.daily.data[0].temperatureHigh.toFixed(1)}°${checkUnits(getSettings.units).temperature} at <t:${
								weatherData.daily.data[0].temperatureHighTime
							}:t>\n-# ${emotes.tempLow} Low of ${weatherData.daily.data[0].temperatureLow.toFixed(1)}°${checkUnits(getSettings.units).temperature} at <t:${
								weatherData.daily.data[0].temperatureLowTime
							}:t>\n### Daylight & Precipitation\n-# 🌧️ Chance of Precipitation: ${Math.floor(weatherData.currently.precipProbability * 100)}%\n-# ${
								emotes.sunrise
							} Sunrise: <t:${todaySunriseTime}:t> [<t:${todaySunriseTime}:R>]\n-# ${emotes.sunset} Sunset: <t:${todaySunsetTime}:t> [<t:${todaySunsetTime}:R>]`,
						);

						hubContainer.addTextDisplayComponents(headerText);

						hubContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

						hubContainer.addTextDisplayComponents(currentText);

						if (getSettings && getSettings.showForecast) {
							const forecastText = new TextDisplayBuilder().setContent(
								`## 3-Day Forecast\n${forecastDay(1, weatherData, getUnits.temperature)}\n${forecastDay(2, weatherData, getUnits.temperature)}\n${forecastDay(3, weatherData, getUnits.temperature)}`,
							);

							hubContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

							hubContainer.addTextDisplayComponents(forecastText);

							var forecastButtonEmote = emotes.buttonOn;
						} else {
							var forecastButtonEmote = emotes.buttonOff;
						}

						if (getSettings && getSettings.showAPIData) {
							const usage = parseInt(apiData['ratelimit-limit']) - parseInt(apiData['ratelimit-remaining']);
							const usagePercent = ((usage / apiData['ratelimit-limit']) * 100).toFixed(2);
							const unixTime = Math.floor(Date.now() / 1000);
							const resetTime = Math.floor(parseInt(apiData['ratelimit-reset']) + unixTime);

							hubContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

							const apiText = new TextDisplayBuilder().setContent(
								[
									`## Pirate Weather API`,
									`${emotes.listArrow} Current Usage: ${usage.toLocaleString()}/${parseInt(apiData['ratelimit-limit']).toLocaleString()} (${usagePercent}%)`,
									`${emotes.listArrow} Usage Resets <t:${resetTime}:R>`,
								].join('\n'),
							);

							hubContainer.addTextDisplayComponents(apiText);

							var apiDataButtonEmote = emotes.buttonOn;
						} else {
							var apiDataButtonEmote = emotes.buttonOff;
						}

						const alertContainer = new ContainerBuilder();

						if (weatherData.alerts.length > 0 && getSettings && getSettings.alerts) {
							const alertText = new TextDisplayBuilder().setContent(
								[
									`# ${emotes.genericAlert} Weather Alerts`,
									`## ${weatherData.alerts[0].title}`,
									`-# ${emotes.listArrow} [View Weather Alert](${weatherData.alerts[0].uri})`,
									`-# ${emotes.listArrow} Issued <t:${weatherData.alerts[0].time}:f> [<t:${weatherData.alerts[0].time}:R>]\n-# ${emotes.listArrow} Expires <t:${weatherData.alerts[0].expires}:f> [<t:${weatherData.alerts[0].expires}:R>]`,
									`\n${emotes.listArrow} **Counties:** ${weatherData.alerts[0].regions.toString().replace(/,/g, ', ').replace('Lake', '**Lake**')}`,
									`\n${weatherData.alerts[0].description
										.replace('* WHAT...', `${emotes.listArrow} **WHAT:** `)
										.replace('* WHERE...', `${emotes.listArrow} **WHERE:** `)
										.replace('* WHEN...', `${emotes.listArrow} **WHEN:** `)
										.replace('* IMPACTS...', `${emotes.listArrow} **IMPACTS:** `)
										.replace('* ADDITIONAL DETAILS...', `${emotes.listArrow} **ADDITIONAL DETAILS:** `)}`,
								].join('\n'),
							);

							alertContainer.addTextDisplayComponents(alertText);

							var apiAlertsButtonEmote = emotes.buttonOn;
						} else {
							var apiAlertsButtonEmote = emotes.buttonOff;
						}

						const lastUpdatedPlusTenSeconds = parseInt(getSettings.lastUpdated) + 10;

						if (Math.floor(DateTime.now().toSeconds()) < lastUpdatedPlusTenSeconds) {
							hubContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

							const updatedText = new TextDisplayBuilder().setContent(`-# Updated **${updateTypeText(getSettings.updateType)}** at <t:${getSettings.lastUpdated}:T> [<t:${getSettings.lastUpdated}:R>]`);

							hubContainer.addTextDisplayComponents(updatedText);
						}

						const toggleForecastButton = new ButtonBuilder().setCustomId('toggleThreeDayForecast').setEmoji(forecastButtonEmote).setLabel('Forecast').setStyle(ButtonStyle.Secondary);
						const toggleAPIDataButton = new ButtonBuilder().setCustomId('toggleAPIData').setEmoji(apiDataButtonEmote).setLabel('API').setStyle(ButtonStyle.Secondary);
						const toggleAlertsButton = new ButtonBuilder().setCustomId('toggleAlerts').setEmoji(apiAlertsButtonEmote).setLabel('Alerts').setStyle(ButtonStyle.Secondary);
						const settingsButton = new ButtonBuilder().setCustomId('settings').setEmoji('⚙️').setStyle(ButtonStyle.Secondary);
						// const startShiftButton = new ButtonBuilder().setCustomId('startShift').setLabel('+').setStyle(ButtonStyle.Success).setDisabled(true);
						// const endShiftButton = new ButtonBuilder().setCustomId('endShift').setLabel('-').setStyle(ButtonStyle.Danger).setDisabled(true);

						const buttonRow = new ActionRowBuilder().addComponents(toggleForecastButton, toggleAPIDataButton, toggleAlertsButton, settingsButton);

						const guild = client.guilds.cache.get(Bun.env.SERVER_ID);
						const channel = guild.channels.cache.get(Bun.env.CHANNEL_ID);

						if (weatherData.alerts.length > 0 && getSettings && getSettings.alerts) {
							var componentList = [hubContainer, alertContainer, buttonRow];
						} else {
							var componentList = [hubContainer, buttonRow];
						}

						channel.messages.fetch(Bun.env.MESSAGE_ID).then(msg => {
							msg.edit({
								embeds: [],
								components: componentList,
								flags: MessageFlags.IsComponentsV2,
							});
						});

						console.log(chalk.blue(`${chalk.bold(`[BOT]`)} Hub Data Updated`));
					}),
				)
				.catch(async error => {
					if (error.response) {
						console.log(chalk.yellow(`${chalk.bold('[Data Lookup Error]')} ${error.response.data}`));

						await wait(5000);

						updateHubData();
					} else if (error.request) {
						console.log(error.request);

						await wait(5000);

						updateHubData();
					} else {
						console.log(error.message);

						await wait(5000);

						updateHubData();
					}
				});
		}

		setInterval(() => {
			const newDate = new Date();
			const currentSecond = newDate.getSeconds();
			const currentMinute = newDate.getMinutes();
			const settingsRow = db_settings
				.prepare('SELECT showForecast, showForecastUpdate, showAPIData, showAPIDataUpdate, location, locationUpdate, units, unitsUpdate, alerts, alertsUpdate FROM settings WHERE guild_id = ?')
				.get(Bun.env.SERVER_ID);

			if (currentSecond === 0 && currentMinute % Bun.env.INTERVAL == 0) {
				updateHubData();
			}

			if (settingsRow) {
				if (settingsRow.showForecast !== settingsRow.showForecastUpdate) {
					db_settings
						.prepare('UPDATE settings SET showForecastUpdate = ?, updateType = ?, lastUpdated = ? WHERE guild_id = ?')
						.run(settingsRow.showForecast, 'forecast', Math.floor(DateTime.now().toSeconds()), Bun.env.SERVER_ID);

					updateHubData();

					console.log(chalk.blue(`${chalk.bold('[BUTTON]')} 3-Day Forecast Toggled`));
				}

				if (settingsRow.showAPIData !== settingsRow.showAPIDataUpdate) {
					db_settings
						.prepare('UPDATE settings SET showAPIDataUpdate = ?, updateType = ?, lastUpdated = ? WHERE guild_id = ?')
						.run(settingsRow.showAPIData, 'api', Math.floor(DateTime.now().toSeconds()), Bun.env.SERVER_ID);

					updateHubData();

					console.log(chalk.blue(`${chalk.bold('[BUTTON]')} API Data Toggled`));
				}

				if (settingsRow.alerts !== settingsRow.alertsUpdate) {
					db_settings
						.prepare('UPDATE settings SET alertsUpdate = ?, updateType = ?, lastUpdated = ? WHERE guild_id = ?')
						.run(settingsRow.alerts, 'alerts', Math.floor(DateTime.now().toSeconds()), Bun.env.SERVER_ID);

					updateHubData();

					console.log(chalk.blue(`${chalk.bold('[BUTTON]')} Weather Alerts Toggled`));
				}

				if (settingsRow.location !== settingsRow.locationUpdate) {
					db_settings
						.prepare('UPDATE settings SET locationUpdate = ?, updateType = ?, lastUpdated = ? WHERE guild_id = ?')
						.run(settingsRow.location, 'location', Math.floor(DateTime.now().toSeconds()), Bun.env.SERVER_ID);

					updateHubData();

					console.log(chalk.blue(`${chalk.bold('[MODAL]')} Location Updated`));
				}

				if (settingsRow.units !== settingsRow.unitsUpdate) {
					db_settings
						.prepare('UPDATE settings SET unitsUpdate = ?, updateType = ?, lastUpdated = ? WHERE guild_id = ?')
						.run(settingsRow.units, 'units', Math.floor(DateTime.now().toSeconds()), Bun.env.SERVER_ID);

					updateHubData();

					console.log(chalk.blue(`${chalk.bold('[MODAL]')} Units Updated`));
				}
			}
		}, 1000);

		updateHubData();
	},
};
