export declare enum CacheFilename {
    Gzip = "cache.tgz",
    Zstd = "cache.tzst",
    Lz4 = "cache.tlz4"
}
export declare enum CompressionMethod {
    Gzip = "gzip",
    Lz4 = "lz4",
    ZstdWithoutLong = "zstd-without-long",
    Zstd = "zstd"
}
export declare enum ArchiveToolType {
    GNU = "gnu",
    BSD = "bsd"
}
export declare const DefaultRetryAttempts = 2;
export declare const DefaultRetryDelay = 5000;
export declare const SocketTimeout = 5000;
export declare const GnuTarPathOnWindows: string;
export declare const SystemTarPathOnWindows: string;
export declare const TarFilename = "cache.tar";
export declare const ManifestFilename = "manifest.txt";
