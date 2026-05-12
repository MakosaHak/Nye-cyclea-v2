import React, { useState } from 'react';
import { Database, Lock, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { toast } from 'sonner';

interface ImportStatus {
  type: 'success' | 'error';
  message: string;
}

interface SettingsBackupSectionProps {
  isPremium: boolean;
}

export function SettingsBackupSection({ isPremium }: SettingsBackupSectionProps) {
  const navigate = useNavigate();
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

  const handleExport = () => {
    if (!isPremium) {
      navigate('/subscribe');
      return;
    }
    try {
      const data = StorageService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `nye-cyclea-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error("Erreur lors de l'export.");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPremium) {
      navigate('/subscribe');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const success = await StorageService.importData(json);
        if (success) {
          setImportStatus({ type: 'success', message: 'Données importées avec succès !' });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setImportStatus({ type: 'error', message: "Échec de l'importation. Fichier invalide." });
        }
      } catch {
        setImportStatus({ type: 'error', message: 'Erreur lors de la lecture du fichier.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mb-6 pb-6 border-b border-gray-200">
      <h3 className="text-gray-700 mb-3 flex items-center gap-2 font-semibold">
        <Database className="w-5 h-5 text-purple-600" />
        Données & Sauvegarde
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Comme vos données sont 100% locales, utilisez ces outils pour les transférer sur un autre
        appareil.
      </p>

      {importStatus && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm font-medium animate-in slide-in-from-top-2 duration-300 ${
            importStatus.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}
        >
          {importStatus.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-100 hover:opacity-80 transition-all font-bold text-sm"
          style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}
        >
          {isPremium ? (
            <Download className="w-4 h-4" />
          ) : (
            <Lock className="w-3.5 h-3.5 opacity-80" />
          )}
          Exporter (JSON)
        </button>

        <div className="relative">
          {!isPremium ? (
            <button
              onClick={() => navigate('/subscribe')}
              className="w-full h-full flex items-center justify-center gap-2 p-3 rounded-xl border border-green-100 hover:opacity-80 transition-all font-bold text-sm"
              style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}
            >
              <Lock className="w-3.5 h-3.5 opacity-80" />
              Importer
            </button>
          ) : (
            <label
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-green-100 hover:opacity-80 transition-all font-bold text-sm cursor-pointer"
              style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}
            >
              <Upload className="w-4 h-4" />
              Importer
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
