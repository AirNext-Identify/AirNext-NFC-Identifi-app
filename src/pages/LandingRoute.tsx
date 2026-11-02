import LandingPage from './LandingPage';
import { StoreProvider } from '../store/StoreContext';

/**
 * A landing e a loja usam a MESMA sacola (StoreProvider, persistida no navegador).
 * Este wrapper fica no mesmo pacote da landing, então ela continua carregando sob demanda.
 */
export default function LandingRoute() {
  return (
    <StoreProvider>
      <LandingPage />
    </StoreProvider>
  );
}
