import { buildUrl } from './build-url.js';
import { parsePattern } from './parse-pattern.js';
import { parse } from 'qs';

export class Route {
    constructor(name, definition) {
        this.name = name;
        this.definition = definition;
    }

    compile(params) {
        return buildUrl(parsePattern(this.template), params);
    }

    matchesUrl(url) {
        if (!this.definition.methods.includes('GET')) return false;

        const pattern = this.#createUrlPattern();
        const [location, query] = this.#splitUrl(url);

        const matches = this.#matchLocation(pattern, location);

        if (matches) {
            return {
                params: this.#decodeParams(matches.groups),
                query: parse(query),
            };
        }

        return false;
    }

    get template() {
        const template = `/${this.definition.uri}`.replace(/\/+$/, '');
        return template === '' ? '/' : template;
    }

    #createUrlPattern() {
        return this.template
            .replace(/\[([^\]]+)\]/g, '($1)?')
            .replace(/\{([^}]+)\}/g, (_, param) => {
                const [name, constraint] = param.split(':');
                return `(?<${name}>${constraint || '[^/]+'})`;
            })
            .replace(/\//g, '\\/');
    }

    #decodeParams(groups) {
        return Object.fromEntries(
            Object.entries(groups || {}).map(([key, value]) => [
                key,
                typeof value === 'string' ? decodeURIComponent(value) : value,
            ]),
        );
    }

    #matchLocation(pattern, location) {
        const regex = new RegExp(`^${pattern}/?$`);
        return regex.exec(location) ?? regex.exec(decodeURI(location));
    }

    #splitUrl(url) {
        return url.replace(/^\w+:\/\//, '').split('?');
    }
}
