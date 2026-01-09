import { SignUp } from "@clerk/nextjs";

type SignUpPageProps = {
  searchParams?: {
    redirect_url?: string;
  };
};

export default function SignUpPage({ searchParams }: SignUpPageProps) {
  const redirectUrl =
    typeof searchParams?.redirect_url === "string"
      ? searchParams.redirect_url
      : "/app/recipes";

  return (
    <div className="auth-page">
      <SignUp redirectUrl={redirectUrl} />
    </div>
  );
}
