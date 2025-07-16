import { Route } from '../src/Route.js';

describe('Route', () => {
    test('compiles a route with parameters', () => {
        const route = new Route('user.profile', {
            uri: '/users/{id}/profile',
            methods: ['GET'],
        });

        const compiledUrl = route.compile({ id: 123 });
        expect(compiledUrl).toBe('/users/123/profile');
    });

    test('matches a URL with query parameters', () => {
        const route = new Route('test.route', {
            uri: 'users/{id}',
            methods: ['GET'],
        });

        const result = route.matchesUrl('/users/123?page=2&sort=name');

        expect(result).toEqual({
            params: { id: '123' },
            query: { page: '2', sort: 'name' },
        });
    });

    test('handles optional parameters in square brackets', () => {
        const route = new Route('user.profile', {
            uri: 'users/{id}[/{action}]',
            methods: ['GET'],
        });

        const compiledUrlWithAction = route.compile({ id: 123, action: 'edit' });
        expect(compiledUrlWithAction).toBe('/users/123/edit');

        const compiledUrlWithoutAction = route.compile({ id: 123 });
        expect(compiledUrlWithoutAction).toBe('/users/123');

        const matchWithAction = route.matchesUrl('/users/123/edit');
        expect(matchWithAction).toEqual({
            params: { id: '123', action: 'edit' },
            query: {},
        });

        const matchWithoutAction = route.matchesUrl('/users/123');
        expect(matchWithoutAction).toEqual({
            params: { id: '123' },
            query: {},
        });
    });

    test('correctly parses and decodes URL parameters', () => {
        const route = new Route('test.route', {
            uri: 'users/{id}/posts/{postId}',
            methods: ['GET'],
        });

        const result = route.matchesUrl('/users/123/posts/abc%20def');

        expect(result).toEqual({
            params: {
                id: '123',
                postId: 'abc def',
            },
            query: {},
        });
    });

    test('returns false for non-GET methods in matchesUrl', () => {
        const route = new Route('test.route', {
            uri: 'test/{id}',
            methods: ['POST'],
        });

        const result = route.matchesUrl('/test/123');
        expect(result).toBe(false);
    });
});
