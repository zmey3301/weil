import {babel} from "@rollup/plugin-babel"
import eslint from "@rollup/plugin-eslint"
import multi from "@rollup/plugin-multi-entry"
import typescript from "@rollup/plugin-typescript"
import copy from "rollup-plugin-copy-merge"
import cleaner from "rollup-plugin-cleaner"

export default {
  input: ["src/**/*.tsx", "src/**/*.ts"],
  output: [
    {
      file: "dist/weil.esm.js",
      format: "es"
    },
  ],
  external: [
    /^@babel\/runtime(?:-corejs3)?(?:\/|$)/,
    /^lodash-es(?:\/|$)/,
    /^react(?:\/|$)/
  ],
  plugins: [
    multi(),
    cleaner({
      targets: [
        "dist/"
      ],
      silent: false
    }),
    eslint({
      throwOnError: true
    }),
    babel({
      exclude: "node_modules/**",
      babelHelpers: "runtime",
      include: "src/**/*",
      extensions: [".ts", ".tsx"]
    }),
    typescript(),
    copy({
      targets: [
        {src: "dist/*.d.ts", file: "dist/index.d.ts"}
      ],
      hook: "writeBundle"
    })
  ]
}
