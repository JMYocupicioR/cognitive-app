import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import App from './App';
import './index.css';

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

if (!recaptchaSiteKey) {
  console.error("Error: VITE_RECAPTCHA_SITE_KEY is not defined in .env");
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    {recaptchaSiteKey ? (
      <GoogleReCaptchaProvider
        reCaptchaKey={recaptchaSiteKey}
        scriptProps={{
          async: true,
          defer: true,
          appendTo: 'body',
          nonce: undefined
        }}
        language="es"
        useEnterprise={false}
        useRecaptchaNet={false}
        container={{
          parameters: {
            badge: 'bottomright',
            size: 'invisible'
          }
        }}
      >
        <App />
      </GoogleReCaptchaProvider>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/30">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Error de Configuración
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            No se pudo inicializar reCAPTCHA. Por favor, verifica la configuración.
          </p>
        </div>
      </div>
    )}
  </StrictMode>
);