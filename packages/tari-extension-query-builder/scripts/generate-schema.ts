import { Config, createGenerator } from "ts-json-schema-generator";
import * as path from "path";
import * as fs from "fs";

import {
  latestVersion as currentAppVersion,
  getSchemaFileName,
  latestVersion,
} from "../src/store/persistence/handlers";

const tsConfigPath = path.resolve(__dirname, "../tsconfig.lib.schema.generation.json");

const outputDir = path.resolve(__dirname, "../schemas");
const fullOutputPath = path.join(outputDir, getSchemaFileName(latestVersion));

const config: Config = {
  path: "src/store/persistence/types.ts",
  tsconfig: tsConfigPath,
  type: "LatestPersistedState",
  expose: "export",
  topRef: true,
  jsDoc: "extended",
  encodeRefs: false,
  discriminatorType: "json-schema",
  sortProps: true,
  extraTags: ["format", "pattern", "minimum", "maximum", "minLength", "maxLength", "example"],
};

function generateSchema() {
  try {
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating output directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Generating schema for LatestPersistedState (v${currentAppVersion})...`);
    console.log(`Using tsconfig: ${tsConfigPath}`);
    console.log(`Target type: ${config.type ?? ""} from ${config.path ?? ""}`);
    console.log(`Output file: ${fullOutputPath}`);

    const generator = createGenerator(config);
    const schema = generator.createSchema(config.type);

    fs.writeFileSync(fullOutputPath, JSON.stringify(schema, null, 2));

    console.log(`Successfully generated JSON schema at: ${fullOutputPath}`);
  } catch (error) {
    console.error("Error generating JSON schema:", error);
    process.exit(1);
  }
}

generateSchema();
