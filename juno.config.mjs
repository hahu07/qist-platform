import { defineConfig } from "@junobuild/config";

/** @type {import('@junobuild/config').JunoConfig} */
export default defineConfig({
  satellite: {
    ids: {
      development: "atbka-rp777-77775-aaaaq-cai",
      production: "<PROD_SATELLITE_ID>",
    },
    source: "out",
    predeploy: ["npm run build"],

  
  },

  emulator: {
    runner: {
      type: "podman",
    },
    skylab: {},
  },
});
