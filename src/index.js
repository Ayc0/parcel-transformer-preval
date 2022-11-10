const { Transformer } = require("@parcel/plugin");
const requireFromString = require("require-from-string");

const prevalTransfomer = new Transformer({
  async transform({ asset }) {
    const requireCacheKeysBeforeRun = Object.keys(require.cache);
    const output = requireFromString(await asset.getCode()); // execute file
    const requireCacheKeysAfterRun = Object.keys(require.cache);

    // Delete elements that were added to the cache by the script
    // This is to ease re-runs in dev mode if the other dependencies have changed
    // without having to stop parcel and restart it.
    for (const cacheKey of requireCacheKeysAfterRun) {
      if (requireCacheKeysBeforeRun.includes(cacheKey)) {
        continue;
      }
      delete require.cache[cacheKey];
    }

    asset.setCode(`module.exports = ${JSON.stringify(output)}`);
    asset.setMap(null); // impossible to relate the new code and the old one

    return [asset];
  },
});

module.exports = prevalTransfomer;
