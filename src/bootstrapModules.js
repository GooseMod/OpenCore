exports.init = (bootstrapModules) => {
  for (const mod of Object.keys(bootstrapModules)) {
    exports[mod] = bootstrapModules[mod];
  }
};