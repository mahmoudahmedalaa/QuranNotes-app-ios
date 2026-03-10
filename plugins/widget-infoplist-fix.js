/**
 * Expo Config Plugin: Fix widget Info.plist duplicate build command
 *
 * Problem: @bacons/apple-targets sets GENERATE_INFOPLIST_FILE = YES alongside
 * INFOPLIST_FILE = ../targets/widget/Info.plist, causing Xcode to produce
 * two commands for the same output file (archive fails with "Multiple commands
 * produce Info.plist").
 *
 * Fix: Set GENERATE_INFOPLIST_FILE = NO for the widget target.
 */
const { withXcodeProject } = require('expo/config-plugins');

module.exports = function widgetInfoPlistFix(config) {
    return withXcodeProject(config, (cfg) => {
        const project = cfg.modResults;
        const pbx = project.hash.project.objects;

        // Find widget target build configurations
        const configLists = pbx.XCConfigurationList || {};
        const buildConfigs = pbx.XCBuildConfiguration || {};

        for (const [id, entry] of Object.entries(buildConfigs)) {
            if (typeof entry !== 'object' || !entry.buildSettings) continue;
            const bs = entry.buildSettings;

            // Match widget target configs that have INFOPLIST_FILE pointing to widget
            if (
                bs.INFOPLIST_FILE &&
                bs.INFOPLIST_FILE.includes('widget/Info.plist') &&
                bs.GENERATE_INFOPLIST_FILE === 'YES'
            ) {
                bs.GENERATE_INFOPLIST_FILE = 'NO';
            }
        }

        return cfg;
    });
};
