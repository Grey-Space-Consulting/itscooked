import { Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import { Grocery } from "./routes/Grocery";
import { Home } from "./routes/Home";
import { AuthCallback } from "./routes/AuthCallback";
import { RecipeDetail } from "./routes/RecipeDetail";
import { Recipes } from "./routes/Recipes";
import { Settings } from "./routes/Settings";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/grocery" element={<Grocery />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
