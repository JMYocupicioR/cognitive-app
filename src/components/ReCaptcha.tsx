import React, { useEffect } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  action?: string;
}

const ReCaptcha: React.FC<ReCaptchaProps> = ({ onVerify, action = 'submit' }) => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  useEffect(() => {
    const handleReCaptchaVerify = async () => {
      if (!executeRecaptcha) {
        console.warn('reCAPTCHA no está listo');
        return;
      }

      try {
        const token = await executeRecaptcha(action);
        onVerify(token);
      } catch (error) {
        console.error('Error al ejecutar reCAPTCHA:', error);
      }
    };

    handleReCaptchaVerify();
  }, [executeRecaptcha, action, onVerify]);

  return null;
};

export default ReCaptcha;