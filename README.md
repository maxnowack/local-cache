# local-cache
GitHub Actions to provide caching data by placing a tarball on the local filesystem. The goal of this action is to speed up saving and restoring of the cache and remove the http overhead that occurs when using the `actions/cache` action.
This action is designed for use with runners that have persistent storage. Please only use this action with self-hosted runners that have a persistent volume. It will not work properly on GitHub hosted runners or runners with ephemeral storage, as the cache will be deleted upon job completion.

## Usage

The actions is designed as a drop-in replacement for `actions/cache@v3`. Take a look at their documentation. You can adapt the usage from their and use all of the features.

The created cache tarballs are placed in `$RUNNER_TOOL_CACHE/$GITHUB_REPOSITORY`.
`GITHUB_REPOSITORY` will be set to the name (`org/repo`) of the repository from where the action is executed. 
`RUNNER_TOOL_CACHE` defaults to `/opt/hostedtoolcache`. This should point to a folder on a persistent storage.

By default, `compression-mode` is `auto`, which keeps the existing behavior of using zstd when available and gzip otherwise. You can set it to `gzip`, `zstd`, or `lz4` to force a specific mode. Changing this mode changes the archive format, so existing caches created with another compression mode will not be restored. Archive filenames use `cache.tgz` for gzip, `cache.tzst` for zstd, and `cache.tlz4` for lz4. When using `lz4`, make sure the `lz4` command is installed on the runner.

### Example cache workflow

````yaml
name: Caching Primes

on: push

jobs:
  build:
    runs-on: self-hosted

    steps:
    - uses: actions/checkout@v4

    - name: Cache Primes
      id: cache-primes
      uses: maxnowack/local-cache@v2
      with:
        path: prime-numbers
        key: ${{ runner.os }}-primes

    - name: Generate Prime Numbers
      if: steps.cache-primes.outputs.cache-hit != 'true'
      run: /generate-primes.sh -d prime-numbers

    - name: Use Prime Numbers
      run: /primes.sh -d prime-numbers

````

### Compression mode

The action defaults to `compression-mode: auto`. To force lz4 compression on runners where `lz4` is installed:

````yaml
- uses: maxnowack/local-cache@v2
  with:
    path: prime-numbers
    key: ${{ runner.os }}-primes
    compression-mode: lz4
    compression-args: --fast=2
````

`compression-args` are passed to the active compression program. In a save step they tune compression; in a restore step they tune decompression.

## Contributing

Contributions to the project are welcome. Feel free to fork and improve. I do my best accept pull requests in a timely manor, especially when tests and updated docs are included.

## License

The code in this project is released under the [MIT License](LICENSE)
