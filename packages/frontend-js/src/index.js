import { Router } from './Router.js';

/**
 * Create a route URL or return a Router instance.
 * @param {string} name - Route name
 * @param {Object} params - Route parameters
 * @param {Object} config - Configuration object
 * @returns {string|Router} Route URL string or Router instance
 */
export function route(name, params, config) {
    const router = new Router(name, params, config);
    return name ? router.toString() : router;
}

/**
 * Vue plugin for Slim routing.
 */
export const NamedRoutes = {
    install(app, options) {
        const routeFunction = (name, params, config = options) => route(name, params, config);

        app.config.globalProperties.route = routeFunction;
        app.provide('route', routeFunction);
    },
};

/**
 * Hook for using named routes in Vue components.
 * @param {Object} defaultConfig - Default configuration object
 * @returns {Function} Route function
 * @throws {Error} If named routes configuration is missing
 */
export function useRoute(defaultConfig) {
    if (!defaultConfig && !globalThis.NamedRoutes && typeof NamedRoutes === 'undefined') {
        throw new Error(
            '@elan-ev/studip-named-routes error: missing configuration. Ensure that a `NamedRoutes` variable is defined globally or pass a config object into the useRoute hook.',
        );
    }

    return (name, params, config = defaultConfig) => route(name, params, config);
}
