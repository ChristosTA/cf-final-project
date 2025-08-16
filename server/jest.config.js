module.exports = {
    testEnvironment: 'node',
    testTimeout: 10000,
    collectCoverageFrom: [
        "src/controllers/**/*.js",
        "src/services/**/*.js",
        "src/middlewares/**/*.js",
        "src/utils/**/*.js",
        "src/models/**/*.js"
    ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "src/schemas.js",
        "src/_tests_/helpers.js"
    ],
    testMatch: ['**/src/_tests_/**/*.spec.js'],
    setupFilesAfterEnv: ['<rootDir>/src/_tests_/setup.js'],
    // optional, αν έχεις ESM κάπου:
    transform: {},
};
