<?php

namespace Studip\NamedRoutes;

use Closure;
use PageLayout;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\App;

class NamedRoutes
{
    public function __construct(protected App $app) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(RequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $this->embedNamedRoutesJs($this->app);
        return $handler->handle($request);
    }

    private function embedNamedRoutesJs($app)
    {
        $namedRoutes = json_encode([
            'url' => $app->getBasePath(),
            'port' => $_SERVER['SERVER_PORT'] ?? 80,
            'defaults' => [],
            'routes' => $this->getNamedRoutes($app),
        ]);

        $content = <<<NAMEDROUTES
            const NamedRoutes = $namedRoutes;
            if (typeof window !== 'undefined' && typeof window.NamedRoutes !== 'undefined') {
                for (let name in window.NamedRoutes.routes) {
                    NamedRoutes.routes[name] = window.NamedRoutes.routes[name];
                }
            }
NAMEDROUTES;

        PageLayout::addHeadElement('script', ['type' => 'text/javascript'], $content);
    }

    private function getNamedRoutes($app)
    {
        $routes = $app->getRouteCollector()->getRoutes();
        $namedRoutes = [];

        foreach ($routes as $route) {
            $name = $route->getName();
            if ($name !== null) {
                $namedRoutes[$name] = [
                    'uri' => ltrim($route->getPattern(), '/'),
                    'methods' => $route->getMethods(),
                ];
            }
        }

        return $namedRoutes;
    }
}
