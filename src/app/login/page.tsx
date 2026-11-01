import { redirect, RedirectType } from "next/navigation";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { demo?: string; slug?: string };
}) {
  const query = searchParams?.demo === "true"
    ? "?demo=true"
    : searchParams?.slug
    ? `?slug=${searchParams.slug}`
    : "";
  redirect(`/dashboard${query}`, RedirectType.replace);
}
