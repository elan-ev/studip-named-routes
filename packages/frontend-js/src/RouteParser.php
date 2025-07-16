<?php
class RouteParser
{
    public const VARIABLE_REGEX = <<<'REGEX'
\{
    \s* ([a-zA-Z_][a-zA-Z0-9_-]*) \s*
    (?:
        : \s* ([^{}]*(?:\{(?-1)\}[^{}]*)*)
    )?
\}
REGEX;

    public const DEFAULT_DISPATCH_REGEX = '[^/]+';
    private const CAPTURING_GROUPS_REGEX = '~
                (?:
                    \(\?\(
                  | \[ [^\]\\\\]* (?: \\\\ . [^\]\\\\]* )* \]
                  | \\\\ .
                ) (*SKIP)(*FAIL) |
                \(
                (?!
                    \? (?! <(?![!=]) | P< | \' )
                  | \*
                )
            ~x';

    public function parse(string $route): array
    {
        $routeWithoutClosingOptionals = rtrim($route, ']');
        $numOptionals = strlen($route) - strlen($routeWithoutClosingOptionals);

        // Split on [ while skipping placeholders
        $segments = preg_split('~' . self::VARIABLE_REGEX . '(*SKIP)(*F) | \[~x', $routeWithoutClosingOptionals);
        assert(is_array($segments));

        if ($numOptionals !== count($segments) - 1) {
            // If there are any ] in the middle of the route, throw a more specific error message
            if (preg_match('~' . self::VARIABLE_REGEX . '(*SKIP)(*F) | \]~x', $routeWithoutClosingOptionals) === 1) {
                throw new RuntimeException('Optional segments can only occur at the end of a route');
            }

            throw new RuntimeException("Number of opening '[' and closing ']' does not match");
        }

        $currentRoute = '';
        $parsedRoutes = [];

        foreach ($segments as $n => $segment) {
            if ($segment === '' && $n !== 0) {
                throw new RuntimeException('Empty optional part');
            }

            $currentRoute .= $segment;
            $parsedRoutes[] = $this->parsePlaceholders($currentRoute);
        }

        return $parsedRoutes;
    }

    private function parsePlaceholders(string $route): array
    {
        if (
            (int) preg_match_all(
                '~' . self::VARIABLE_REGEX . '~x',
                $route,
                $matches,
                PREG_OFFSET_CAPTURE | PREG_SET_ORDER
            ) === 0
        ) {
            return [$route];
        }

        $offset = 0;
        $routeData = [];

        $parsedVariableNames = [];

        foreach ($matches as $set) {
            if ($set[0][1] > $offset) {
                $routeData[] = substr($route, $offset, $set[0][1] - $offset);
            }

            if (in_array($set[1][0], $parsedVariableNames, true)) {
                throw new RuntimeException('placeholderAlreadyDefined');
            }

            if (isset($set[2])) {
                $this->guardAgainstCapturingGroupUsage(trim($set[2][0]), $set[1][0]);
            }

            $parsedVariableNames[] = $set[1][0];

            $routeData[] = [$set[1][0], isset($set[2]) ? trim($set[2][0]) : self::DEFAULT_DISPATCH_REGEX];

            $offset = $set[0][1] + strlen($set[0][0]);
        }

        if ($offset !== strlen($route)) {
            $routeData[] = substr($route, $offset);
        }

        return $routeData;
    }

    private function guardAgainstCapturingGroupUsage(string $regex, string $variableName): void
    {
        // Needs to have at least a ( to contain a capturing group
        if (!str_contains($regex, '(')) {
            return;
        }

        // Semi-accurate detection for capturing groups
        if (preg_match(self::CAPTURING_GROUPS_REGEX, $regex) !== 1) {
            return;
        }

        throw new RuntimeException('variableWithCaptureGroup');
    }
}
