const axios = require("axios");
const { analyzeFileContent, generateEnhancedTestTemplate,shouldGenerateTest } = require("./utils");

const API_BASE_URL = process.env.AI_TEST_API || "http://165.232.191.4:3000";

/**
 * Generate tests for a list of source files using the specified test framework.
 *
 * Iterates over the provided files, generates a test for each file that should have one,
 * and returns an array of generated test descriptors.
 *
 * @param {Array<Object>} files - Array of source file objects. Each object must include `name` and `content`; `path` or `relativePath` may be provided and will be forwarded to generation routines.
 * @param {string} [framework="jest"] - Target test framework (e.g., "jest", "vitest", "mocha").
 * @returns {Array<Object>} Array of generated test descriptors with properties: `filename` (computed test filename), `content` (test source), and `sourceFile` (original file name).
 * @throws {Error} If any part of the generation process fails; the error message is prefixed with "Test generation failed:".
 */
async function generateTests(files, framework = "jest") {
  const generatedTests = [];

  try {
    for (const file of files) {
      if (shouldGenerateTest(file)) {
        console.log(`🔍 Generating test for: ${file.name}`);

        const testContent = await generateSingleTest(file, framework);

        generatedTests.push({
          filename: getTestFileName(file.name, framework),
          content: testContent,
          sourceFile: file.name,
        });
      }
    }

    return generatedTests;
  } catch (error) {
    throw new Error(`Test generation failed: ${error.message}`);
  }
}

/**
 * Compute the test filename for a source file based on the target test framework.
 *
 * @param {string} originalName - The source filename including its extension (e.g., "utils.ts").
 * @param {string} framework - Target test framework: "jest", "vitest", or "mocha". Other values default to Jest-style naming.
 * @returns {string} The generated test filename (e.g., "utils.test.js", "utils.test.ts", or "utils.spec.js").
 */
function getTestFileName(originalName, framework) {
  const baseName = originalName.replace(/\.(js|ts|jsx|tsx)$/, "");

  switch (framework) {
    case "jest":
      return `${baseName}.test.js`;
    case "vitest":
      return `${baseName}.test.ts`;
    case "mocha":
      return `${baseName}.spec.js`;
    default:
      return `${baseName}.test.js`;
  }
}

/**
 * Generate a test for a single source file by requesting generation from the configured AI server, falling back to a local enhanced generator if the server is unavailable or returns an error.
 *
 * @param {Object} file - Source file information.
 * @param {string} file.name - Filename (e.g., "utils.js").
 * @param {string} file.content - File contents to analyze.
 * @param {string} [file.path] - Absolute or repository path to the file.
 * @param {string} [file.relativePath] - Path relative to the project root; used preferentially over `path`.
 * @param {string} framework - Test framework to target (e.g., "jest", "vitest", "mocha").
 * @returns {string} The generated test content; when the AI server is unavailable or returns an error, returns an enhanced locally generated test. 
 */
async function generateSingleTest(file, framework) {
  try {
    console.log(`📡 Connecting to server: ${API_BASE_URL}/analyze`);

    const response = await axios.post(
      `${API_BASE_URL}/analyze`,
      {
        file: {
          name: file.name,
          content: file.content,
          path: file.relativePath || file.path,
        },
        framework: framework,
        options: {
          generateEdgeCases: true,
          includeSetup: true,
        },
      },
      {
        timeout: 120000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      const method = response.data.metadata?.method || "API";
      console.log(`✅ Test generated via ${method} for ${file.name}`);
      if (!response.data.generatedTest)
        throw new Error("Server returned success but no test content");
      return response.data.generatedTest;
    } else {
      throw new Error("Server returned unsuccessful response");
    }
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.warn(
        `🔄 Server unavailable, using local fallback for ${file.name}`
      );
      return generateLocalFallbackTest(file, framework);
    } else if (error.response) {
      console.warn(
        `⚠️ Server error (${error.response?.status}): ${error.response?.data?.error || error.message || 'Unknown error'}`
      );
      return generateLocalFallbackTest(file, framework);
    } else {
      console.warn(`⚠️ Network error: ${error.message}`);
      return generateLocalFallbackTest(file, framework);
    }
  }
}

/**
 * Generate an enhanced local test template for a source file using static analysis.
 * @param {Object} file - Source file metadata and content; must include `name` and `content`.
 * @param {string} framework - Target test framework (e.g., "jest", "vitest", "mocha").
 * @returns {string} The generated test file content.
 */
function generateLocalFallbackTest(file, framework) {
  const baseName = file.name.replace(/\.(js|ts|jsx|tsx)$/, "");

  console.log(
    `🔧 Generating enhanced local test for ${file.name} using shared utilities`
  );

  const analysis = analyzeFileContent(file.content);

  return generateEnhancedTestTemplate(baseName, analysis, framework, file);
}

module.exports = {
  generateTests,
  generateSingleTest,
};