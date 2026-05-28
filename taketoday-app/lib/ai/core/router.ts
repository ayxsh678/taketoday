/**
 * Task router: resolves ordered provider chains for a given task type.
 */

import { DEFAULT_ROUTES } from "../config/routes";
import type {
  AITaskType,
  AIProviderSlug,
  ProviderRoute,
  BaseAIProvider,
} from "./types";
import { getProvider } from "../providers/registry";

export interface RouteOverride {
  forceProvider?: AIProviderSlug;
  forceModel?: string;
}

/**
 * Resolves the ordered provider chain for a task type.
 * Applies force overrides if provided.
 */
export async function resolveProviderChain(
  taskType: AITaskType,
  overrides?: RouteOverride
): Promise<ProviderRoute[]> {
  const baseRoutes = DEFAULT_ROUTES[taskType] ?? [];

  let routes = baseRoutes.filter((r) => r.enabled);

  if (overrides?.forceProvider) {
    const forceSlug = overrides.forceProvider;
    const forceModel = overrides.forceModel;

    // Check if there's already a route for this provider
    const existingRoute = routes.find((r) => r.provider === forceSlug);

    if (existingRoute) {
      // Move it to the front with optional model override
      const forced: ProviderRoute = {
        ...existingRoute,
        model: forceModel ?? existingRoute.model,
        priority: 0,
      };
      routes = [forced, ...routes.filter((r) => r.provider !== forceSlug)];
    } else {
      // Add a new forced route at priority 0
      const forced: ProviderRoute = {
        provider: forceSlug,
        model: forceModel ?? "",
        priority: 0,
        enabled: true,
      };
      routes = [forced, ...routes];
    }
  } else if (overrides?.forceModel) {
    // Override model on first route only
    if (routes.length > 0) {
      routes = [
        { ...routes[0], model: overrides.forceModel },
        ...routes.slice(1),
      ];
    }
  }

  return routes.sort((a, b) => a.priority - b.priority);
}

/**
 * Gets a provider instance for a given route.
 * Returns null if the provider is unavailable.
 */
export function selectProvider(route: ProviderRoute): BaseAIProvider | null {
  const provider = getProvider(route.provider);
  if (!provider || !provider.isAvailable()) {
    return null;
  }
  return provider;
}
