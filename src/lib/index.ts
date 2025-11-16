// place files you want to import through the `$lib` alias in this folder.
import type { CookieSerializeOptions } from 'cookie';

export class AppConstants {
	// --- API Endpoints ---
	/**
	 * The base URL for all API requests.
	 */
	public static readonly BASE_API_URL: string = 'http://10.19.163.77:8000/api';

	// --- Auth Endpoints ---
	/**
	 * Authentication endpoints that should NOT have auth headers.
	 */
	public static readonly AUTH_ENDPOINTS: readonly string[] = ['/login', '/signup'];

	// --- Auth Cookies ---
	/**
	 * Auth cookie key (only access token is stored)
	 */
	public static readonly COOKIES_AUTH: string = 'AuthorizationToken';

	/**
	 * Options for setting the auth cookie
	 */
	public static readonly COOKIES_OPTIONS: CookieSerializeOptions & { path: string } = {
		httpOnly: true,
		path: '/',
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 // 1 day in seconds
		// secure: process.env.NODE_ENV === 'production' // enable in production
	};

	/**
	 * Options used for deleting the auth cookie
	 */
	public static readonly COOKIES_DELETE_OPTIONS: Pick<
		CookieSerializeOptions,
		'path' | 'httpOnly' | 'sameSite'
	> & { path: string } = {
		httpOnly: true,
		path: '/',
		sameSite: 'strict'
	};
}
