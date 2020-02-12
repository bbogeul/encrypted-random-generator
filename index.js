'use strict'

const crypto = require('crypto')

const safeChar = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~'.split('');
const useNum = '0123456789'.split('');

const generateForCustomCharacters = (length, characters) => {
	const characterCount = characters.length;
	const maxValidSelector = (Math.floor(0x10000 / characterCount) * characterCount) - 1;
	const entropyLength = 2 * Math.ceil(1.1 * length); // 혹시 모르니 값을 한 번 더
	let string = '';
	let stringLength = 0;

	while (stringLength < length) { // 쓰지 못하는 값 대비
		const entropy = crypto.randomBytes(entropyLength);
		let entropyPosition = 0;

		while (entropyPosition < entropyLength && stringLength < length) {
			const entropyValue = entropy.readUInt16LE(entropyPosition);
			entropyPosition += 2;
			if (entropyValue > maxValidSelector) { // 분배 부분에서 막힐 수 있으니 일단 뛰어넘자
				continue;
			}

			string += characters[entropyValue % characterCount];
			stringLength++;
		}
	}

	return string;
};

const allowedTypes = [
	undefined,
	'hex',
	'base64',
	'url-safe',
	'numeric'
];

module.exports = ({length, type, characters}) => {
	if (!(length >= 0 && Number.isFinite(length))) {
		throw new TypeError('Expected a `length` to be a non-negative finite number');
	}

	if (type !== undefined && characters !== undefined) {
		throw new TypeError('Expected either `type` or `characters`');
	}

	if (characters !== undefined && typeof characters !== 'string') {
		throw new TypeError('Expected `characters` to be string');
	}

	if (!allowedTypes.includes(type)) {
		throw new TypeError(`Unknown type: ${type}`);
	}

	if (type === undefined && characters === undefined) {
		type = 'hex';
	}

	if (type === 'hex' || (type === undefined && characters === undefined)) {
		return crypto.randomBytes(Math.ceil(length * 0.5)).toString('hex').slice(0, length); 
	}

	if (type === 'base64') {
		return crypto.randomBytes(Math.ceil(length * 0.75)).toString('base64').slice(0, length);
	}

	if (type === 'url-safe') {
		return generateForCustomCharacters(length, urlSafeCharacters);
	}

	if (type === 'numeric') {
		return generateForCustomCharacters(length, numericCharacters);
	}

	if (characters.length === 0) {
		throw new TypeError('Expected `characters` string length to be greater than or equal to 1');
	}

	if (characters.length > 0x10000) {
		throw new TypeError('Expected `characters` string length to be less or equal to 65536');
	}
 
	return generateForCustomCharacters(length, characters.split(''));
};