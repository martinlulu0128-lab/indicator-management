# tob-admin-framework

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Deploy to GitHub Pages

This project is configured to automatically deploy to GitHub Pages using GitHub Actions. 
The deployment will happen automatically when changes are pushed to the `master` branch.

To access your deployed application, visit:
https://martinlulu0128-lab.github.io/indicator-management/

If this is your first deployment, you may need to:
1. Go to your repository's Settings > Pages
2. Set the source to "GitHub Actions"
3. Wait for the GitHub Actions workflow to complete

#### Troubleshooting 404 Errors

If you encounter a 404 error when accessing the deployed application, please check the following:

1. Ensure the GitHub Actions workflow has completed successfully:
   - Go to your repository's "Actions" tab
   - Check that the "Deploy to GitHub Pages" workflow has completed without errors

2. Verify GitHub Pages settings:
   - Go to your repository's Settings > Pages
   - Ensure the source is set to "GitHub Actions"

3. Check the base path configuration:
   - The `vite.config.ts` file should have `base: '/indicator-management/'` 
   - This should match your repository name

4. Wait a few minutes:
   - GitHub Pages may take a few minutes to propagate changes after a successful deployment