export function buildUrl(ast, params = {}) {
    const keys = new Set(Object.keys(params));

    function processNode(node) {
        if (node.type === 'static') {
            return node.value;
        } else if (node.type === 'placeholder') {
            if (params[node.name]) {
                keys.delete(node.name);
                return params[node.name];
            }
            return '';
        } else if (node.type === 'optional') {
            const processed = node.children.map(processNode).join('');
            // Check if all placeholders in this optional segment are filled
            const allFilled = node.children.every((child) => child.type !== 'placeholder' || params[child.name]);
            return allFilled ? processed : '';
        } else if (node.type === 'route') {
            return node.children.map(processNode).join('');
        }
        return '';
    }

    let url = processNode(ast);

    // Remove any double slashes that might have been created
    url = url.replace(/\/+/g, '/');

    // Remove trailing slash if it's not in the original pattern
    if (
        ast.children[ast.children.length - 1].type !== 'static' ||
        !ast.children[ast.children.length - 1].value.endsWith('/')
    ) {
        url = url.replace(/\/$/, '');
    }

    // Add query parameters for any extra params
    const extraParams = [...keys]
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

    if (extraParams) {
        url += (url.includes('?') ? '&' : '?') + extraParams;
    }

    return url;
}
