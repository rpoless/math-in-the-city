(function (global) {
    const root = global.CityBuilder = global.CityBuilder || {};

    root.modules = root.modules || {};

    root.registerModule = function registerModule(name, api) {
        root.modules[name] = api;
        return api;
    };

    root.getModule = function getModule(name) {
        return root.modules[name] || null;
    };

    root.pickFunctions = function pickFunctions(names) {
        const api = {};
        names.forEach((name) => {
            const value = global[name];
            if (typeof value === 'function') {
                api[name] = value;
            }
        });
        return api;
    };

    root.defineState = function defineState(descriptors) {
        const state = {};
        Object.entries(descriptors).forEach(([key, getter]) => {
            Object.defineProperty(state, key, {
                enumerable: true,
                get: getter
            });
        });
        return state;
    };
})(window);
