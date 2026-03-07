import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { BlogLayoutClient } from "./blog-layout-client";

export const metadata: Metadata = {
  title: {
    template: "%s",
    default: `Blog · ${SITE_NAME}`,
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <BlogLayoutClient>{children}</BlogLayoutClient>;
}
