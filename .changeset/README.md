# Changesets

Every pull request that changes what the package does adds one file here with
`npm run changeset`: which bump (patch, minor, major) and one or two sentences
for the changelog. `npm run version` turns them into the version number and
`CHANGELOG.md`; `npm run release` builds and publishes.
