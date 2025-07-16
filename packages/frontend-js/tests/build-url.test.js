import { buildUrl } from '../src/build-url.js';

describe('buildUrl', () => {
    test('generates a basic URL with static segments only', () => {
        const ast = {
            type: 'route',
            children: [
                { type: 'static', value: '/users' },
                { type: 'static', value: '/profile' },
            ],
        };

        const result = buildUrl(ast);
        expect(result).toBe('/users/profile');
    });

    test('replaces placeholders with provided parameters', () => {
        const ast = {
            type: 'route',
            children: [
                { type: 'static', value: '/users/' },
                { type: 'placeholder', name: 'id', pattern: '[^/]+' },
                { type: 'static', value: '/posts/' },
                { type: 'placeholder', name: 'postId', pattern: '[^/]+' },
            ],
        };

        const result = buildUrl(ast, { id: '123', postId: '456' });
        expect(result).toBe('/users/123/posts/456');
    });

    test('handles optional segments when all placeholders are filled', () => {
        const ast = {
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
        };

        const result = buildUrl(ast, { id: '123', name: 'john' });
        expect(result).toBe('/users/123/john');
    });

    test('omits optional segments when placeholders are not filled', () => {
        const ast = {
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
        };

        const result = buildUrl(ast, { id: '123' });
        expect(result).toBe('/users/123');
    });

    test('removes double slashes from the generated URL', () => {
        const ast = {
            type: 'route',
            children: [
                { type: 'static', value: '/users/' },
                { type: 'placeholder', name: 'id', pattern: '[^/]+' },
                { type: 'static', value: '//posts/' },
                { type: 'placeholder', name: 'postId', pattern: '[^/]+' },
            ],
        };

        const result = buildUrl(ast, { id: '123', postId: '456' });
        expect(result).toBe('/users/123/posts/456');
    });

    test('adds query parameters for extra params not used in the pattern', () => {
        const ast = {
            type: 'route',
            children: [
                { type: 'static', value: '/users/' },
                { type: 'placeholder', name: 'id', pattern: '[^/]+' },
            ],
        };

        const result = buildUrl(ast, { id: '123', query: 'search', page: '2' });
        expect(result).toBe('/users/123?query=search&page=2');
    });

    test('handles a mix of static, placeholder, and optional segments', () => {
        const ast = {
            type: 'route',
            children: [
                { type: 'static', value: '/users/' },
                { type: 'placeholder', name: 'userId', pattern: '[^/]+' },
                { type: 'static', value: '/posts' },
                {
                    type: 'optional',
                    children: [
                        { type: 'static', value: '/' },
                        { type: 'placeholder', name: 'postId', pattern: '[^/]+' },
                        {
                            type: 'optional',
                            children: [
                                { type: 'static', value: '/comments/' },
                                { type: 'placeholder', name: 'commentId', pattern: '[^/]+' },
                            ],
                        },
                    ],
                },
            ],
        };

        const result = buildUrl(ast, {
            userId: '123',
            postId: '456',
            commentId: '789',
            extra: 'param',
        });

        expect(result).toBe('/users/123/posts/456/comments/789?extra=param');
    });
});
