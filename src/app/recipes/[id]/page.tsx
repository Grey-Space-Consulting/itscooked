import { redirect } from "next/navigation";

type RecipeRedirectPageProps = {
  params: {
    id: string;
  };
};

export default function RecipeRedirectPage({ params }: RecipeRedirectPageProps) {
  redirect(`/app/recipes/${params.id}`);
}
