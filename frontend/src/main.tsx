import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <App />
      </JotaiProvider>
    </QueryClientProvider>
  </StrictMode>,
);
