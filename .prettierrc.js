export default {
  singleQuote: true,
  semi: true,
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  importOrder: [
    "^react",
    "^react/(.*)$",
    "<THIRD_PARTY_MODULES>",
    "@/(.*)$",
    "^[./]",
  ],
  importOrderParserPlugins: [
    "typescript",
    "jsx",
    "decorators-legacy",
  ],
}
