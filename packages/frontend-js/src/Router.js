import { Route } from './Route.js';

/**
 * @class Router
 * @extends String
 *
 * The Router class provides functionality to work with Slim routes in JavaScript.
 * It allows for route generation, current route checking, and parameter handling.
 *
 * @throws {Error} Throws an error if the specified route name is not in the route list.
 */
export class Router extends String {
    /**
     * Private properties for the Router class.
     * @private
     * @property {Object} #config - Private property to store the configuration.
     * @property {Route} #route - Private property to store the current route.
     * @property {Object} #params - Private property to store the route parameters.
     */
    #config;
    #route;
    #params;

    /**
     * @param {String} [name] - Route name.
     * @param {Object} [params] - Route parameters.
     * @param {Object} [config] - configuration.
     */
    constructor(name, params, config) {
        super();
        this.#initializeConfig(config);
        this.#initializeRoute(name, params);
    }

    current(name, params) {
        const { name: current, params: currentParams, query, route } = this.#unresolve();

        if (!name) return current;

        const match = this.#matchRouteName(name, current);

        if ([null, undefined].includes(params) || !match) {
            return match;
        }

        return this.#checkParams(current, route, currentParams, query, params);
    }

    has(name) {
        return this.#config.routes.hasOwnProperty(name);
    }

    toString() {
        return `${this.#config.url}/${this.#route.compile(this.#params)}`.replace(/\/+/g, '/');
    }

    valueOf() {
        return this.toString();
    }

    get params() {
        const { params, query } = this.#unresolve();
        return { ...params, ...query };
    }

    get queryParams() {
        return this.#unresolve().query;
    }

    get routeParams() {
        return this.#unresolve().params;
    }

    #areParamsEmpty(params, routeParams) {
        return Object.values(params).every((p) => !p) && !Object.values(routeParams).some((v) => v !== undefined);
    }

    #buildCurrentUrl(host, pathname, search) {
        return pathname.replace(this.#config.url.replace(/^\w*:\/\/[^/]+/, ''), '').replace(/^\/+/, '/') + search;
    }

    #checkParams(current, route, currentParams, query, params) {
        const routeObject = new Route(current, route);
        const routeParams = { ...currentParams, ...query };

        if (this.#areParamsEmpty(params, routeParams)) {
            return true;
        }

        return this.#isSubset(routeParams, params);
    }

    #currentUrl() {
        const { host, pathname, search } = this.#location();
        return this.#buildCurrentUrl(host, pathname, search);
    }
    #defaults(route) {
        return route.parameterSegments
            .filter(({ name }) => this.#config.defaults[name])
            .reduce((result, { name }) => ({ ...result, [name]: this.#config.defaults[name] }), {});
    }

    #initializeConfig(config) {
        this.#config = config ?? (typeof NamedRoutes !== 'undefined' ? NamedRoutes : globalThis?.NamedRoutes);
    }

    #initializeRoute(name, params) {
        if (name) {
            if (!this.#config.routes[name]) {
                throw new Error(`@elan-ev/studip-named-routes error: route '${name}' is not in the route list.`);
            }
            this.#route = new Route(name, this.#config.routes[name]);
            this.#params = params;
        }
    }

    #isSubset(subset, full) {
        return Object.entries(subset).every(([key, value]) => {
            if (Array.isArray(value) && Array.isArray(full[key])) {
                return value.every((v) => full[key].includes(v));
            }
            if (typeof value === 'object' && typeof full[key] === 'object' && value !== null && full[key] !== null) {
                return this.#isSubset(value, full[key]);
            }
            return full[key] == value;
        });
    }

    #location() {
        const { host = '', pathname = '', search = '' } = typeof window !== 'undefined' ? window.location : {};
        return {
            host: this.#config.location?.host ?? host,
            pathname: this.#config.location?.pathname ?? pathname,
            search: this.#config.location?.search ?? search,
        };
    }

    #matchRouteName(name, current) {
        return new RegExp(`^${name.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`).test(current);
    }

    #unresolve(url) {
        url = url ?? this.#currentUrl();
        let matchedParams = {};
        const [name, route] = Object.entries(this.#config.routes).find(
            ([name, route]) => (matchedParams = new Route(name, route).matchesUrl(url)),
        ) || [undefined, undefined];
        return { name, ...matchedParams, route };
    }
}
