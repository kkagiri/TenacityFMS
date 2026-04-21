/**
 * File:          polyfills.js
 * Purpose:       Loads browser compatibility polyfills before the application boots.
 * Dependencies:  react-app-polyfill, Object
 * Last Modified: 2026-04-21
 *
 * Key Functions:
 * - Defines Object.hasOwn(): Adds a fallback for older browsers that do not support the static method.
 */
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

if (typeof Object.hasOwn !== 'function') {
	Object.defineProperty(Object, 'hasOwn', {
		value(target, property) {
			if (target === null || target === undefined) {
				throw new TypeError('Object.hasOwn called on null or undefined');
			}

			return Object.prototype.hasOwnProperty.call(Object(target), property);
		},
		configurable: true,
		writable: true,
	});
}
