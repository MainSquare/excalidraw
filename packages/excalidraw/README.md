# Excalidraw

**Excalidraw** is exported as a component to be directly embedded in your project.

## Installation

Use `npm` or `yarn` to install the package.

```bash
npm install react react-dom @mainsquare/excalidraw
# or
yarn add react react-dom @mainsquare/excalidraw
```

> **Note**: If you don't want to wait for the next stable release and try out the unreleased changes, use `@mainsquare/excalidraw@next`.

#### Self-hosting fonts

By default, Excalidraw will try to download all the used fonts from the [CDN](https://esm.run/@mainsquare/excalidraw/dist/prod).

For self-hosting purposes, you'll have to copy the content of the folder `node_modules/@mainsquare/excalidraw/dist/prod/fonts` to the path where your assets should be served from (i.e. `public/` directory in your project). In that case, you should also set `window.EXCALIDRAW_ASSET_PATH` to the very same path, i.e. `/` in case it's in the root:

```js
<script>window.EXCALIDRAW_ASSET_PATH = "/";</script>
```

### Dimensions of Excalidraw

Excalidraw takes _100%_ of `width` and `height` of the containing block so make sure the container in which you render Excalidraw has non zero dimensions.

## Demo

Go to [CodeSandbox](https://codesandbox.io/p/sandbox/github/excalidraw/excalidraw/tree/master/examples/with-script-in-browser) example.

## Integration

Head over to the [docs](https://docs.excalidraw.com/docs/@mainsquare/excalidraw/integration).

## API

Head over to the [docs](https://docs.excalidraw.com/docs/@mainsquare/excalidraw/api).

## Contributing

Head over to the [docs](https://docs.excalidraw.com/docs/@mainsquare/excalidraw/contributing).
