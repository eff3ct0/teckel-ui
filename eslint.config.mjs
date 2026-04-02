import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["website/**"],
  },
];

export default eslintConfig;
