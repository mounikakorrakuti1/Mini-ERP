import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/store/auth.store';
import { ThemeProvider } from '@/store/theme.store';
import { DbProvider } from '@/store/db.store';
import { router } from '@/routes/router';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DbProvider>
          <RouterProvider router={router} />
        </DbProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

