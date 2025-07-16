import { parsePattern } from '../src/parse-pattern.js';

describe('parsePattern', () => {
    test('parses a simple static route', () => {
        const result = parsePattern('/users');
        expect(result).toEqual({
            type: 'route',
            children: [{ type: 'static', value: '/users' }],
        });
    });

    test('parses a route with a placeholder', () => {
        const result = parsePattern('/users/{id}');
        expect(result).toEqual({
            type: 'route',
            children: [
                { type: 'static', value: '/users/' },
                { type: 'placeholder', name: 'id', pattern: '[^/]+' },
            ],
        });
    });

    test('parses a route with a placeholder and a regexp', () => {
        const result = parsePattern('/users/{id:[0-9]+}');
        expect(result).toEqual({
            type: 'route',
            children: [
                { type: 'static', value: '/users/' },
                { type: 'placeholder', name: 'id', pattern: '[0-9]+' },
            ],
        });
    });

    test('parses a route with a placeholder and a special regexp', () => {
        const result = parsePattern('/users/{id:[0-9]{1,3}}');
        expect(result).toEqual({
            type: 'route',
            children: [
                { type: 'static', value: '/users/' },
                { type: 'placeholder', name: 'id', pattern: '[0-9]{1,3}' },
            ],
        });
    });

    test('parses a route with a placeholder and custom regex', () => {
        const result = parsePattern('/users/{id:\\d+}');
        expect(result).toEqual({
            type: 'route',
            children: [
                { type: 'static', value: '/users/' },
                { type: 'placeholder', name: 'id', pattern: '\\d+' },
            ],
        });
    });

    test('parses a route with an optional segment', () => {
        const result = parsePattern('/users[/{id}]');
        expect(result).toEqual({
            type: 'route',
            children: [
                { type: 'static', value: '/users' },
                {
                    type: 'optional',
                    children: [
                        { type: 'static', value: '/' },
                        { type: 'placeholder', name: 'id', pattern: '[^/]+' },
                    ],
                },
            ],
        });
    });

    test('parses a route with nested optional segments', () => {
        const result = parsePattern('/users[/{id}[/{name}]]');
        expect(result).toEqual({
            type: 'route',
            children: [
                { type: 'static', value: '/users' },
                {
                    type: 'optional',
                    children: [
                        { type: 'static', value: '/' },
                        { type: 'placeholder', name: 'id', pattern: '[^/]+' },
                        {
                            type: 'optional',
                            children: [
                                { type: 'static', value: '/' },
                                { type: 'placeholder', name: 'name', pattern: '[^/]+' },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    test('parses a route with multiple placeholders', () => {
        const result = parsePattern('/users/{id}/posts/{postId}');
        expect(result).toEqual({
            type: 'route',
            children: [
                { type: 'static', value: '/users/' },
                { type: 'placeholder', name: 'id', pattern: '[^/]+' },
                { type: 'static', value: '/posts/' },
                { type: 'placeholder', name: 'postId', pattern: '[^/]+' },
            ],
        });
    });

    // test('handles escaped curly braces', () => {
    //   const result = parsePattern('/users/\{escaped\}');
    //   expect(result).toEqual({
    //     type: 'route',
    //     children: [
    //       { type: 'static', value: '/users/{escaped}' }
    //     ]
    //   });
    // });

    test('handles empty pattern', () => {
        const result = parsePattern('');
        expect(result).toEqual({
            type: 'route',
            children: [],
        });
    });
});
