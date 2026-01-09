import { SignUp } from "@clerk/nextjs";

type SignUpPageProps = {
  searchParams?: Promise<{
    redirect_url?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectUrl =
    typeof resolvedSearchParams?.redirect_url === "string"
      ? resolvedSearchParams.redirect_url
      : "/app/recipes";

  return (
    <div className="auth-page">
      <SignUp redirectUrl={redirectUrl} />
    </div>
  );
}
