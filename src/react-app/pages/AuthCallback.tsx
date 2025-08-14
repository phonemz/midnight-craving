import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        navigate('/admin');
      } catch (error) {
        console.error('Authentication failed:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin mb-4">
          <Loader2 className="w-12 h-12 text-orange-500 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Completing Authentication...
        </h2>
        <p className="text-gray-600">
          Please wait while we log you in.
        </p>
      </div>
    </div>
  );
}
