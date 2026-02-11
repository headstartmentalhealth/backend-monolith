/** @type {import('@maizzle/framework').Config} */
module.exports = {
  build: {
    templates: {
      source: 'src/templates',
      destination: {
        path: 'build_production',
        extension: 'html',
      },
      assets: {
        source: 'src/assets',
        destination: 'assets',
      },
    },
  },
}
