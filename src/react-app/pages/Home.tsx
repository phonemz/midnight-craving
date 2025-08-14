import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { User, Phone, UtensilsCrossed } from 'lucide-react';
import { CreateCustomerSchema } from '@/shared/types';

export default function Home() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const storedCustomerId = localStorage.getItem('customerId');
    if (storedCustomerId && !isNaN(parseInt(storedCustomerId))) {
      navigate('/order');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validation = CreateCustomerSchema.safeParse({ name, phone });
      
      if (!validation.success) {
        const fieldErrors: { name?: string; phone?: string } = {};
        validation.error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone }),
      });

      if (response.ok) {
        const customer = await response.json();
        localStorage.setItem('customerId', customer.id.toString());
        navigate('/order');
      } else {
        setErrors({ name: 'Failed to create customer profile' });
      }
    } catch (error) {
      setErrors({ name: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
            <UtensilsCrossed className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Feast Flow
          </h1>
          <p className="text-gray-600 text-lg">Quick and easy food ordering</p>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Welcome! Let's get started
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? 'Creating Profile...' : 'Continue to Menu'}
              </button>
            </form>

            
          </div>
        </div>

        {/* Admin Link */}
        <div className="mt-8">
          <button
            onClick={() => navigate('/admin')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Admin Access
          </button>
        </div>
      </div>
    </div>
  );
}
