const ROUTE = 'route';
const STATIC = 'static';
const PLACEHOLDER = 'placeholder';
const OPTIONAL = 'optional';

const VARIABLE_REGEX =
    /\{\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*(?::\s*([^{}]*(?:\{(?:[^{}]*(?:\{[^{}]*\}[^{}]*)*)\}[^{}]*)*))?}/g;

export function parsePattern(pattern) {
    const ast = { type: ROUTE, children: [] };
    let currentNode = ast;
    let buffer = '';
    let inPlaceholder = false;
    let inOptional = false;
    let optionalDepth = 0;

    function addStaticNode() {
        if (buffer) {
            currentNode.children.push({ type: STATIC, value: buffer });
            buffer = '';
        }
    }

    [...pattern].forEach(handleCharacter);

    addStaticNode();
    return ast;

    function handleCharacter(char) {
        if (char === '{' && !inPlaceholder) {
            handleOpenBrace();
        } else if (char === '}' && inPlaceholder) {
            handleCloseBrace();
        } else if (char === '[' && !inPlaceholder) {
            handleOpenBracket();
        } else if (char === ']' && inOptional) {
            handleCloseBracket();
        } else {
            buffer += char;
        }
    }

    function handleCloseBracket() {
        addStaticNode();
        optionalDepth--;
        if (optionalDepth === 0) {
            inOptional = false;
            currentNode = ast;
        } else {
            currentNode = currentNode.parent;
        }
    }

    function handleOpenBracket() {
        addStaticNode();
        const optionalNode = { type: OPTIONAL, children: [] };
        currentNode.children.push(optionalNode);
        currentNode = optionalNode;
        inOptional = true;
        optionalDepth++;
    }

    function handleCloseBrace() {
        // const b = `{${buffer}}`;
        // console.debug(JSON.stringify(b), b.match(VARIABLE_REGEX), '{postId}' === b);
        // console.debug("START", VARIABLE_REGEX.test(b));

        if (`{${buffer}}`.match(VARIABLE_REGEX) === null) {
            buffer += '}';
            return;
        }

        const [name, regex = '[^/]+'] = buffer.split(':');
        currentNode.children.push({
            type: PLACEHOLDER,
            name,
            pattern: regex,
        });
        inPlaceholder = false;
        buffer = '';
    }

    function handleOpenBrace() {
        addStaticNode();
        inPlaceholder = true;
        buffer = '';
    }
}
