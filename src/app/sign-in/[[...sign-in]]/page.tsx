import { SignIn } from "@clerk/nextjs";

type SignInPageProps = {
  searchParams?: Promise<{
    redirect_url?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectUrl =
    typeof resolvedSearchParams?.redirect_url === "string"
      ? resolvedSearchParams.redirect_url
      : "/app/recipes";

  return (
    <div className="auth-page">
      <SignIn redirectUrl={redirectUrl} />
    </div>
  );
}
