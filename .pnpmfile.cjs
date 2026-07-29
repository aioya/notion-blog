const TYPESCRIPT_ESLINT_PACKAGES = new Set([
  "@typescript-eslint/eslint-plugin",
  "@typescript-eslint/parser",
  "@typescript-eslint/project-service",
  "@typescript-eslint/tsconfig-utils",
  "@typescript-eslint/type-utils",
  "@typescript-eslint/typescript-estree",
  "@typescript-eslint/utils",
  "typescript-eslint",
]);

function readPackage(pkg) {
  if (!TYPESCRIPT_ESLINT_PACKAGES.has(pkg.name)) {
    return pkg;
  }

  if (pkg.peerDependencies?.typescript) {
    delete pkg.peerDependencies.typescript;
  }

  pkg.dependencies = {
    ...pkg.dependencies,
    typescript: "5.9.3",
  };

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
