import React, { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { CycleEntry } from '../types';
import { toast } from 'sonner';
import { useCyclesContext } from '../contexts/CyclesContext';

interface AddCycleProps {
  onClose: () => void;
}

export function AddCycle({ onClose }: AddCycleProps) {
  const { addCycle } = useCyclesContext();
  const settings = StorageService.getSettings();
  const defaultPeriodLength = settings.defaultPeriodLength || 5;

  const [startDate, setStartDate] = useState('');
  const [periodDuration, setPeriodDuration] = useState(defaultPeriodLength);

  const computedEndDate = useMemo(() => {
    if (!startDate) return null;
    const periodEndDate = new Date(startDate);
    periodEndDate.setDate(periodEndDate.getDate() + periodDuration - 1);
    return periodEndDate.toISOString().split('T')[0];
  }, [startDate, periodDuration]);

  const formattedEndDate = computedEndDate
    ? new Date(computedEndDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : null;

  const formattedStartDate = startDate
    ? new Date(startDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      toast.error('Veuillez renseigner la date de début.');
      return;
    }
    const auth = StorageService.getAuth();
    if (!auth) {
      toast.error('Erreur : Veuillez recharger la page.');
      return;
    }
    const newCycle: CycleEntry = {
      id: crypto.randomUUID(),
      userId: auth.id,
      startDate,
      endDate: computedEndDate ?? undefined,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };
    await addCycle(newCycle);
    toast.success('Cycle enregistré 🌸');
    onClose();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(236,72,153,0.10))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />

      {/* Sheet — slides up from bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 51,
          display: 'flex',
          justifyContent: 'center',
          animation: 'slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: '32px 32px 0 0',
            boxShadow: '0 -8px 48px rgba(244,63,94,0.12)',
            border: '1.5px solid rgba(255,255,255,0.8)',
            borderBottom: 'none',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            overflow: 'hidden',
          }}
        >
          {/* Drag handle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '14px',
              paddingBottom: '4px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '4px',
                borderRadius: '99px',
                backgroundColor: 'rgba(244,63,94,0.2)',
              }}
            />
          </div>

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '12px 24px 16px',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#f9a8ba',
                  marginBottom: '2px',
                }}
              >
                Nouveau cycle
              </p>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1c0b0f', lineHeight: 1.2 }}>
                Enregistrons vos règles 🌸
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(244,63,94,0.08)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, marginTop: '2px',
              }}
              aria-label="Fermer le formulaire"
            >
              <X size={16} color="#f43f5e" aria-hidden="true" />
            </button>

          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              padding: '0 24px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Q1 — Start date */}
            <div>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    1
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1c0b0f' }}>
                    Quel est le premier jour de vos règles ?
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#c084a0', marginLeft: '34px' }}>
                  Le tout premier jour où l'écoulement a commencé
                </p>
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={today}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 16px',
                  borderRadius: '18px',
                  border: '1.5px solid rgba(244,63,94,0.18)',
                  background: 'rgba(255,241,244,0.6)',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#3b0a18',
                  outline: 'none',
                  fontFamily: 'inherit',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              />

              {formattedStartDate && (
                <p
                  style={{
                    marginTop: '8px',
                    marginLeft: '4px',
                    fontSize: '12px',
                    color: '#f43f5e',
                    fontWeight: 600,
                  }}
                >
                  📅 {formattedStartDate}
                </p>
              )}
            </div>

            {/* Q2 — Duration */}
            <div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ec4899, #db2777)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  2
                </span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#1c0b0f' }}>
                  Quelle est la durée de vos règles ?
                </span>
              </div>
              <p
                style={{
                  fontSize: '12px',
                  color: '#c084a0',
                  marginLeft: '34px',
                  marginBottom: '12px',
                }}
              >
                Nombre de jours d'écoulement habituel
              </p>

              {/* Stepper */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'rgba(255,241,244,0.6)',
                  border: '1.5px solid rgba(244,63,94,0.15)',
                  borderRadius: '20px',
                  padding: '16px 20px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setPeriodDuration((d) => Math.max(1, d - 1))}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.9)',
                    border: '1.5px solid rgba(244,63,94,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(244,63,94,0.08)',
                  }}
                >
                  <ChevronDown size={20} color="#f43f5e" />
                </button>

                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{ fontSize: '52px', fontWeight: 800, color: '#f43f5e', lineHeight: 1 }}
                  >
                    {periodDuration}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#c084a0',
                      marginTop: '2px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {periodDuration === 1 ? 'jour' : 'jours'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPeriodDuration((d) => Math.min(10, d + 1))}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.9)',
                    border: '1.5px solid rgba(244,63,94,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(244,63,94,0.08)',
                  }}
                >
                  <ChevronUp size={20} color="#f43f5e" />
                </button>
              </div>

              {/* End date preview */}
              {formattedEndDate && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px 16px',
                    borderRadius: '14px',
                    background: 'rgba(244,63,94,0.06)',
                    border: '1px solid rgba(244,63,94,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#f43f5e',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f43f5e' }}>
                    Fin estimée le <strong>{formattedEndDate}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  height: '52px',
                  borderRadius: '18px',
                  border: '1.5px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255,255,255,0.6)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!startDate}
                style={{
                  flex: 2,
                  height: '52px',
                  borderRadius: '18px',
                  border: 'none',
                  background: startDate
                    ? 'linear-gradient(135deg, #f43f5e, #ec4899)'
                    : 'rgba(244,63,94,0.3)',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#fff',
                  cursor: startDate ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  boxShadow: startDate ? '0 6px 24px rgba(244,63,94,0.28)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                Enregistrer 🌸
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
