import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "warn",
			"react-hooks/set-state-in-effect": "off",
			// French/Arabic UI: copy is apostrophe-dense (l'élève, d'isolation...).
			// Raw apostrophes render correctly in JSX; escaping every one to &apos;
			// fights the language and adds noise. Rule intentionally disabled.
			"react/no-unescaped-entities": "off",
		},
	},
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
	]),
]);

export default eslintConfig;
