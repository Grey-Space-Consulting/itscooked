import { redirect } from "next/navigation";

type RecipeRedirectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RecipeRedirectPage({
  params,
}: RecipeRedirectPageProps) {
  const { id } = await params;
  redirect(`/app/recipes/${id}`);
}
