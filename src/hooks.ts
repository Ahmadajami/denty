import { deLocalizeUrl } from '$lib/paraglide/runtime';

export const reroute = (request) => deLocalizeUrl(request.url).pathname;

const decimalNames = ['Decimal', 'Decimal2', 'PrismaDecimal', 'Decimal_js'];

export const transport = {
	PrismaDecimal: {
		encode: (value) => {
			if (value && typeof value === 'object' && decimalNames.includes(value.constructor?.name)) {
				return value.toString();
			}
			return false;
		},
		decode: (value) => parseFloat(value)
	}
};
