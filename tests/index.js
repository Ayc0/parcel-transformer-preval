const { Parcel, createWorkerFarm } = require("@parcel/core");
const { MemoryFS } = require("@parcel/fs");
const vm = require("node:vm");

const test = require("ava");

const build = async (input) => {
  const workerFarm = createWorkerFarm();
  const outputFS = new MemoryFS(workerFarm);

  let bundler = new Parcel({
    entries: input,
    config: require.resolve("./stubs/config.json"),
    workerFarm,
    outputFS,
  });

  try {
    let { bundleGraph } = await bundler.run();

    for (let bundle of bundleGraph.getBundles()) {
      const code = await outputFS.readFile(bundle.filePath, "utf8");
      const context = { module: {} };
      vm.runInNewContext(code, context);
      return { code, value: context.module.exports };
    }
  } finally {
    await workerFarm.end();
  }
};

test.serial("bundles number properly", async (t) => {
  const { code, value } = await build(
    require.resolve("./stubs/number.preval.js")
  );
  t.is(true, code.includes("module.exports = 13"));
  t.is(13, value);
  t.pass();
});

test.serial(
  "bundles array properly & can work with native modules",
  async (t) => {
    const { code, value } = await build(
      require.resolve("./stubs/fs-array.preval.js")
    );
    t.is(false, code.includes("require"));
    t.is(false, code.includes("readdirSync"));

    t.deepEqual(value, [
      "config.json",
      "fs-array.preval.js",
      "number.preval.js",
      "wrapper.js",
    ]);
    t.pass();
  }
);

test.serial("bundles when sub files are preval files", async (t) => {
  const { value } = await build(require.resolve("./stubs/wrapper.js"));

  t.deepEqual(value, {
    number: 13,
    fsArray: [
      "config.json",
      "fs-array.preval.js",
      "number.preval.js",
      "wrapper.js",
    ],
  });
  t.pass();
});
