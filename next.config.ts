import type { NextConfig } from "next";

const isGithubBuild = process.env.BUILD_TARGET === "github";
const githubBasePath = isGithubBuild ? process.env.PAGES_BASE_PATH || "" : "";

const nextConfig: NextConfig = {
  output: isGithubBuild ? "export" : undefined,
  trailingSlash: true,
  basePath: githubBasePath,
  assetPrefix: githubBasePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
