'use client';

import { useState } from 'react';
import { CampParticipantWithDetails, ParticipantStatus } from '@/types';
import { Mail, Check, Copy, AlertCircle, Download } from 'lucide-react';

interface EmailExportProps {
  participants: CampParticipantWithDetails[];
  campName: string;
}

type ExportFilter = 'all' | ParticipantStatus;

const filterLabels: Record<ExportFilter, string> = {
  'all': 'Alle',
  'vorgeschlagen': 'Vorgeschlagen',
  'eingeladen': 'Eingeladen',
  'zugesagt': 'Zugesagt',
  'abgesagt': 'Abgesagt',
  'nachgerückt': 'Nachgerückt',
};

export function EmailExport({ participants, campName }: EmailExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ExportFilter>('zugesagt');

  // Filter participants and extract emails
  const filteredParticipants = participants.filter(p => {
    if (selectedFilter === 'all') return true;
    return p.status === selectedFilter;
  });

  const emails = filteredParticipants
    .filter(p => p.athlete?.email)
    .map(p => p.athlete!.email!);

  const participantsWithoutEmail = filteredParticipants.filter(p => !p.athlete?.email);

  const emailString = emails.join(', ');

  const handleCopy = async () => {
    if (emails.length === 0) return;
    
    try {
      await navigator.clipboard.writeText(emailString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadCsv = () => {
    if (filteredParticipants.length === 0) return;

    // Create CSV content
    const headers = ['Vorname', 'Nachname', 'Verein', 'Email', 'Status'];
    const rows = filteredParticipants.map(p => [
      p.athlete?.first_name || '',
      p.athlete?.last_name || '',
      p.athlete?.club || '',
      p.athlete?.email || '',
      p.status,
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${campName.replace(/\s+/g, '_')}_Teilnehmer.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
      >
        <Mail className="w-4 h-4" />
        Email-Export
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">
            Email-Adressen exportieren
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <span className="sr-only">Schließen</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Filter Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Teilnehmer-Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(filterLabels) as ExportFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === filter
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {filterLabels[filter]}
                </button>
              ))}
            </div>
          </div>

          {/* Email Count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {emails.length} von {filteredParticipants.length} Teilnehmern haben eine Email-Adresse
            </span>
          </div>

          {/* Email List */}
          {emails.length > 0 ? (
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  readOnly
                  value={emailString}
                  className="w-full h-32 px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg resize-none font-mono"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    copied 
                      ? 'bg-green-600 text-white' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      In Zwischenablage kopieren
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleDownloadCsv}
                  className="flex items-center gap-2 px-4 py-2 btn-secondary px-4 py-2.5 gap-2 transition-colors"
                  title="Als CSV herunterladen"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-lg">
              <Mail className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-slate-500">
                Keine Email-Adressen verfügbar
              </p>
            </div>
          )}

          {/* Warning for missing emails */}
          {participantsWithoutEmail.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Hinweis:</span>{' '}
                {participantsWithoutEmail.length} Teilnehmer haben keine Email-Adresse hinterlegt.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}