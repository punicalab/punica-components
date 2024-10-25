const loadComponent = (scope: string, module: string) => {
  return async () => {
    //@ts-ignore
    await __webpack_init_sharing__('default');
    const container = window[scope];
    //@ts-ignore
    await container.init(__webpack_share_scopes__.default);
    //@ts-ignore
    const factory = await window[scope].get(module);
    const Module = factory();

    return Module;
  };
};

export default loadComponent;
