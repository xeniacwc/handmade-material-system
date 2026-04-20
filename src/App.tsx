import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useStore } from './store/useStore';

// Pages
import { MaterialList } from './pages/Materials/MaterialList';
import { MaterialForm } from './pages/Materials/MaterialForm';
import { MaterialDetail } from './pages/Materials/MaterialDetail';
import { RecipeList } from './pages/Recipes/RecipeList';
import { RecipeForm } from './pages/Recipes/RecipeForm';
import { ProductList } from './pages/Products/ProductList';
import { ProductForm } from './pages/Products/ProductForm';
import { SettingsList } from './pages/Settings/SettingsList';

function App() {
  const loadFromSupabase = useStore((s) => s.loadFromSupabase);

  // Load data from Supabase on first mount
  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ProductList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="materials" element={<MaterialList />} />
          <Route path="materials/new" element={<MaterialForm />} />
          <Route path="materials/:id" element={<MaterialDetail />} />
          <Route path="materials/:id/edit" element={<MaterialForm />} />
          <Route path="recipes" element={<RecipeList />} />
          <Route path="recipes/new" element={<RecipeForm />} />
          <Route path="settings" element={<SettingsList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
