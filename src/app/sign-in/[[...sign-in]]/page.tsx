import { SignIn } from "@clerk/nextjs";

type SignInPageProps = {
  searchParams?: {
    redirect_url?: string;
  };
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  const redirectUrl =
    typeof searchParams?.redirect_url === "string"
      ? searchParams.redirect_url
      : "/app/recipes";

  return (
    <div className="auth-page">
      <SignIn redirectUrl={redirectUrl} />
    </div>
  );
}
