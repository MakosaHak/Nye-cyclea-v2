import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Check, X, FileText, 
  Loader2, Zap, Heart, Star, ChevronRight,
  Lock, Sparkles
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { toast } from 'sonner';

export function SubscriptionScreen() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const auth = StorageService.getAuth();

  const handleBack = () => {
    navigate('/settings');
  };

  const handleSubscribe = async (planId: string) => {
    if (!auth) {
      toast.error('Veuillez vous connecter pour vous abonner.');
      navigate('/auth');
      return;
    }

    try {
      setLoadingPlan(planId);
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.info(`Paiement bientôt disponible ! Plan : ${planId === 'monthly' ? 'Mensuel' : 'Annuel'}`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Une erreur est survenue.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const premiumFeatures = [
    { label: 'IA Prédictive avancée', icon: Zap },
    { label: 'Rapports PDF illimités', icon: FileText },
    { label: 'Analyses de fertilité', icon: Heart },
    { label: 'Interface sans publicité', icon: Star },
  ];

  const comparisonData = [
    { label: 'Suivi des cycles', free: true, premium: true },
    { label: 'Calendrier prévisionnel', free: true, premium: true },
    { label: 'Rapports PDF Santé', free: false, premium: true },
    { label: 'IA Prédictive experte', free: false, premium: true },
    { label: 'Analyses de fertilité', free: false, premium: true },
    { label: 'Zéro Publicité', free: false, premium: true },
  ];

  return (
    <div className="sub-container">
      <style>{`
        .sub-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #fff5f7 0%, #fdf2f8 100%);
          font-family: 'Poppins', sans-serif;
          color: #18181b;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .back-nav {
          width: 100%;
          max-width: 450px;
          margin-bottom: 1rem;
          position: relative;
          z-index: 50;
        }

        .back-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: white;
          border: 1px solid #fee2e2;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #f43f5e;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(244, 63, 94, 0.08);
        }

        .app-logo {
          width: 80px;
          height: 80px;
          border-radius: 22px;
          box-shadow: 0 10px 25px rgba(244, 63, 94, 0.15);
          margin-bottom: 1rem;
        }

        .title-h1 {
          font-size: 1.4rem;
          font-weight: 900;
          text-align: center;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }

        .title-h1 span {
          color: #f43f5e;
        }

        .premium-card {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 32px;
          padding: 2.5rem 2rem;
          box-shadow: 0 25px 50px -12px rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(254, 226, 226, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2.5rem;
          position: relative;
        }

        .billing-selector {
          background: #f4f4f5;
          padding: 4px;
          border-radius: 100px;
          display: flex;
          gap: 4px;
          margin-bottom: 2.5rem;
        }

        .billing-btn {
          padding: 10px 20px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 700;
          border: none;
          background: transparent;
          color: #71717a;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .billing-btn.active {
          background: white;
          color: #18181b;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }

        .discount-badge {
          position: absolute;
          top: -12px;
          right: -10px;
          background: #f43f5e;
          color: white;
          font-size: 0.6rem;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 800;
          border: 2px solid white;
          box-shadow: 0 4px 8px rgba(244, 63, 94, 0.2);
        }

        .price-display {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .price-amount {
          font-size: 3.5rem;
          font-weight: 900;
          color: #f43f5e;
          line-height: 1;
        }

        .price-currency {
          font-size: 1.1rem;
          font-weight: 700;
          color: #f43f5e;
          margin-left: 4px;
          opacity: 0.8;
        }

        .price-info {
          display: block;
          margin-top: 0.75rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: #71717a;
        }

        .features-list {
          width: 100%;
          border-top: 1px solid #f4f4f5;
          padding: 1.5rem 0;
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .feature-icon-box {
          width: 20px;
          height: 20px;
          color: #f43f5e;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #3f3f46;
        }

        .cta-btn {
          width: 100%;
          padding: 1.25rem;
          background: linear-gradient(to right, #f43f5e, #e11d48);
          color: white;
          border: none;
          border-radius: 20px;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s;
          box-shadow: 0 10px 20px rgba(244, 63, 94, 0.25);
        }

        .cta-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(244, 63, 94, 0.3);
          filter: brightness(1.1);
        }

        .cta-btn:active {
          transform: translateY(0);
        }

        .comparison-box {
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 28px;
          padding: 1.5rem;
          border: 1px solid rgba(254, 226, 226, 0.8);
          margin-bottom: 2rem;
        }

        .comp-title {
          font-size: 0.8rem;
          font-weight: 800;
          text-align: center;
          margin-bottom: 1.5rem;
          color: #a1a1aa;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .comp-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.8rem 0;
          border-bottom: 1px solid rgba(254, 226, 226, 0.4);
        }

        .comp-row:last-child {
          border-bottom: none;
        }

        .comp-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #52525b;
        }

        .comp-values {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .comp-val {
          width: 24px;
          display: flex;
          justify-content: center;
        }

        .trust-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.7rem;
          color: #a1a1aa;
          font-weight: 600;
          margin-bottom: 2rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <nav className="back-nav">
        <button className="back-circle" onClick={handleBack}>
          <ArrowLeft size={20} />
        </button>
      </nav>

      <img src="/icons/pwa-192x192.png" alt="Logo" className="app-logo" />

      <h1 className="title-h1">Choisissez votre plan<br/><span>Nye Cyclea Premium</span></h1>

      <div className="premium-card">
        <div className="billing-selector">
          <button 
            className={`billing-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Mensuel
          </button>
          <button 
            className={`billing-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Annuel
            <span className="discount-badge">-25%</span>
          </button>
        </div>

        <div className="price-display">
          <span className="price-amount">
            {billingCycle === 'yearly' ? '5 000' : '500'}
          </span>
          <span className="price-currency">FCFA</span>
          <span className="price-info">
            {billingCycle === 'yearly' ? 'Soit environ 417 FCFA par mois' : 'Paiement mensuel sans engagement'}
          </span>
        </div>

        <div className="features-list">
          {premiumFeatures.map((feature, i) => (
            <div key={i} className="feature-item">
              <div className="feature-icon-box">
                <Check size={18} strokeWidth={3} />
              </div>
              <span className="feature-label">{feature.label}</span>
            </div>
          ))}
        </div>

        <button 
          className="cta-btn"
          onClick={() => handleSubscribe(billingCycle)}
          disabled={loadingPlan !== null}
        >
          {loadingPlan ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              Commencer l'essai
              <ChevronRight size={22} />
            </>
          )}
        </button>
      </div>

      <div className="comparison-box">
        <h3 className="comp-title">Gratuit vs Premium</h3>
        <div className="comp-row" style={{ borderBottom: '2px solid rgba(244, 63, 94, 0.1)' }}>
          <span className="comp-label" style={{ opacity: 0 }}>Feature</span>
          <div className="comp-values">
            <span className="comp-label" style={{ width: '24px', textAlign: 'center', fontSize: '0.65rem' }}>Gratuit</span>
            <span className="comp-label" style={{ width: '24px', textAlign: 'center', fontSize: '0.65rem', color: '#f43f5e' }}>Pro</span>
          </div>
        </div>
        {comparisonData.map((row, i) => (
          <div key={i} className="comp-row">
            <span className="comp-label">{row.label}</span>
            <div className="comp-values">
              <div className="comp-val">
                {row.free ? <Check size={16} color="#d4d4d8" /> : <X size={16} color="#f4f4f5" />}
              </div>
              <div className="comp-val">
                <Check size={18} color="#f43f5e" strokeWidth={3} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="trust-footer">
        <Lock size={12} />
        Paiement sécurisé via Mobile Money
      </div>
    </div>
  );
}
