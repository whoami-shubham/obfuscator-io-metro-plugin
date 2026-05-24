const BUNDLE_CMD = 'bundle';
const EXPO_BUNDLE_CMD = 'export';            // expo: `npx expo export`
const BUNDLE_OUTPUT_CLI_ARG = '--bundle-output';
const BUNDLE_SOURCEMAP_OUTPUT_CLI_ARG = '--sourcemap-output';
const BUNDLE_DEV_CLI_ARG = '--dev';
// Expo writes bundles under these dirs (classic: dist/, modern: dist/_expo/static/js/)
const EXPO_OUTPUT_DIRS = ['dist/_expo/static/js', 'dist/bundles', 'dist'];
// Env-var overrides so any toolchain can supply paths explicitly
const ENV_BUNDLE_OUTPUT = 'JSO_BUNDLE_OUTPUT';
const ENV_SOURCEMAP_OUTPUT = 'JSO_SOURCEMAP_OUTPUT';
const TEMP_FOLDER = '.jso';
const DIST_TEMP_FOLDER = `${TEMP_FOLDER}/dist`;
const SOURCE_MAPS_TEMP_FOLDER = `${DIST_TEMP_FOLDER}/jsoSourceMaps`;
const SRC_TEMP_FOLDER = `${TEMP_FOLDER}/src`;
const BEG_ANNOTATION = "/* JSO-BEG */";
const END_ANNOTATION =  "/* JSO-END */";
const EXTS = /.(j|t)s(x)?$/i;

module.exports = {
  BUNDLE_CMD,
  EXPO_BUNDLE_CMD,
  BUNDLE_OUTPUT_CLI_ARG,
  BUNDLE_SOURCEMAP_OUTPUT_CLI_ARG,
  BUNDLE_DEV_CLI_ARG,
  EXPO_OUTPUT_DIRS,
  ENV_BUNDLE_OUTPUT,
  ENV_SOURCEMAP_OUTPUT,
  TEMP_FOLDER,
  DIST_TEMP_FOLDER,
  SOURCE_MAPS_TEMP_FOLDER,
  SRC_TEMP_FOLDER,
  BEG_ANNOTATION,
  END_ANNOTATION,
  EXTS
}