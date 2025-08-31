function emoteFile(debug) {
	if (debug === 'true') return 'dev';

	return 'prod';
}

module.exports = { emoteFile };
