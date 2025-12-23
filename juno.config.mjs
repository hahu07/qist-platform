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

    authentication: {
      google: {
        // TODO: Replace with your real Google OAuth client ID, e.g.
        // "1234567890-abcdef.apps.googleusercontent.com".
        // Prefer configuring it via the JUNO_GOOGLE_CLIENT_ID env variable.
        clientId: "242959252692-lmq2rn1srl543thnkb6hhlqaga45alnf.apps.googleusercontent.com"
      },
    },
  },

  emulator: {
    runner: {
      type: "podman",
    },
    skylab: {},
  },
});
