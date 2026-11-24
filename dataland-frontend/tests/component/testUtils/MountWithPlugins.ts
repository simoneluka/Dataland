import { DatalandPreset } from '@/assets/theme/dataland-theme.ts';
import { routes } from '@/router';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import DialogService from 'primevue/dialogservice';
import { plugin, defaultConfig } from '@formkit/vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { mount, type CyMountOptions, type VueTestUtils } from 'cypress/vue';
import { computed, defineComponent, h, type Component, type ComponentPublicInstance, type DefineComponent } from 'vue';
import type Keycloak from 'keycloak-js';
import { assertDefined } from '@/utils/TypeScriptUtils';
import DynamicDialog from 'primevue/dynamicdialog';
import { ApiClientProvider } from '@/services/ApiClients';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';

type MountingOptions = {
  router?: Router;
  keycloak?: Keycloak;
};

type VueComponent = new () => Pick<ComponentPublicInstance, '$' | '$props'>;
type Empty = Record<never, never>;
type DialogWrapper = DefineComponent<Empty, Empty, Empty, Empty, Empty>;

type CypressMountOptions<T extends VueComponent> = Omit<CyMountOptions<InstanceType<NoInfer<T>>['$props']>, 'data'> & {
  data?: () => object;
};

type Mounted<T extends VueComponent> = Cypress.Chainable<{
  wrapper: InstanceType<typeof VueTestUtils.VueWrapper<InstanceType<T>>>;
  component: InstanceType<T>;
}>;

// Cypress mounts the component as-is and returns its wrapper and vm. Its bundled overloads cannot express this
// for a generic component constructor, so adapt that signature at the boundary, using Cypress's actual wrapper type.
const mountComponent = mount as <T extends VueComponent>(component: T, options: CypressMountOptions<T>) => Mounted<T>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mountWithPlugins: typeof mountWithPlugins;
      mountWithDialog: typeof mountWithDialog;
    }
  }
}

/**
 * A slightly modified version of the vue mount function that automatically initiates plugins used in dataland
 * like PrimeVue, Pinia or the Router and also allows for simple authentication injection
 * @param component the component you want to mount
 * @param options the mountingOptions for mounting said component
 * @returns a cypress chainable for the mounted wrapper and the Vue component
 */
function mountWithPlugins<T extends VueComponent>(
  component: T,
  options: MountingOptions & CypressMountOptions<T>
): Mounted<T> {
  options.global = options.global ?? {};
  options.global.plugins = options.global.plugins ?? [];
  options.global.plugins.push(
    createPinia(),
    [
      PrimeVue,
      {
        theme: {
          preset: DatalandPreset,
        },
      },
    ],
    DialogService,
    [VueQueryPlugin, { queryClient: new QueryClient() }]
  );
  options.global.provide = options.global.provide ?? {};

  options.router ??= createRouter({
    routes: routes,
    history: createMemoryHistory(),
  });

  if (options.keycloak) {
    const keycloak = options.keycloak;
    options.global.provide.apiClientProvider = computed(() => new ApiClientProvider(Promise.resolve(keycloak)));
    options.global.provide.getKeycloakPromise = (): Promise<Keycloak> => {
      return Promise.resolve(keycloak);
    };
    options.global.provide.authenticated = keycloak.authenticated;
  }

  options.global.plugins.push(
    {
      install(app) {
        app.use(assertDefined(options.router));
      },
    },
    {
      install(app) {
        app.use(plugin, defaultConfig);
      },
    }
  );

  return mountComponent(component, options);
}

/**
 * Mounts a component in a wrapper also containing a DynamicDialog. Manipulating the component is only possible through the properties.
 * @param component the component you want to mount
 * @param options general mounting options; transitions are left unstubbed
 * @param props properties to set for the component
 * @returns a cypress chainable for the mounted wrapper and the wrapper of the Vue component
 */
function mountWithDialog(
  component: Component,
  options: MountingOptions & Pick<CyMountOptions<object>, 'global'>,
  props: object = {}
): Mounted<DialogWrapper> {
  const componentWrapper: DialogWrapper = defineComponent({
    render() {
      return [h(DynamicDialog), h(component, props ?? {})];
    },
  });
  const { stubs, ...global } = options.global ?? {};
  const namedStubs = Array.isArray(stubs) ? Object.fromEntries(stubs.map((name) => [name, true])) : stubs;
  return mountWithPlugins(componentWrapper, {
    ...options,
    global: { ...global, stubs: { ...namedStubs, transition: false } },
  });
}

Cypress.Commands.add('mountWithPlugins', mountWithPlugins);
Cypress.Commands.add('mountWithDialog', mountWithDialog);
