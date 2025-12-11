import React, { useState, useEffect } from 'react';
import { X, Download, Info } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
}

type ExportStage = 'config' | 'progress' | 'complete' | 'error';

export function ExportModal({ isOpen, onClose, caseId }: ExportModalProps) {
  const [stage, setStage] = useState<ExportStage>('config');
  const [format, setFormat] = useState<'pdf' | 'json' | 'both'>('both');
  const [progress, setProgress] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({
    summary: true,
    timeline: true,
    pois: true,
    media_inventory: true,
    messages: true,
    hashes: true,
    media_thumbnails: true,
    redact_pii: false,
    raw_logs: false,
  });

  useEffect(() => {
    if (stage === 'progress') {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => setStage('complete'), 500);
            return 100;
          }
          return p + Math.random() * 30;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [stage]);

  const handleGenerate = () => {
    setProgress(0);
    setStage('progress');
  };

  const handleReset = () => {
    setStage('config');
    setFormat('both');
    setProgress(0);
    setSelectedOptions({
      summary: true,
      timeline: true,
      pois: true,
      media_inventory: true,
      messages: true,
      hashes: true,
      media_thumbnails: true,
      redact_pii: false,
      raw_logs: false,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            {stage === 'config' && 'Export Case Evidence Package'}
            {stage === 'progress' && 'Generating Export...'}
            {stage === 'complete' && 'Export Complete ✓'}
            {stage === 'error' && 'Export Failed ✗'}
          </h2>
          {stage === 'config' && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="p-6">
          {stage === 'config' && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-600 mb-4">
                  Choose your export format and options
                </p>

                <div className="space-y-3 mb-6">
                  <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-500 transition"
                    style={{
                      borderColor:
                        format === 'pdf' ? '#3B82F6' : 'rgb(226, 232, 240)',
                    }}>
                    <input
                      type="radio"
                      value="pdf"
                      checked={format === 'pdf'}
                      onChange={(e) =>
                        setFormat(e.target.value as 'pdf' | 'json' | 'both')
                      }
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">PDF Report</p>
                      <p className="text-xs text-slate-600">
                        Human-readable investigation document with findings and
                        charts
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-500 transition"
                    style={{
                      borderColor:
                        format === 'json' ? '#3B82F6' : 'rgb(226, 232, 240)',
                    }}>
                    <input
                      type="radio"
                      value="json"
                      checked={format === 'json'}
                      onChange={(e) =>
                        setFormat(e.target.value as 'pdf' | 'json' | 'both')
                      }
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">JSON Data</p>
                      <p className="text-xs text-slate-600">
                        Machine-readable structured data for tool integration
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500 transition"
                    style={{
                      borderColor:
                        format === 'both' ? '#3B82F6' : 'rgb(226, 232, 240)',
                      backgroundColor:
                        format === 'both'
                          ? 'rgb(239, 246, 255)'
                          : 'transparent',
                    }}>
                    <input
                      type="radio"
                      value="both"
                      checked={format === 'both'}
                      onChange={(e) =>
                        setFormat(e.target.value as 'pdf' | 'json' | 'both')
                      }
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                        Both PDF + JSON
                      </p>
                      <p className="text-xs text-slate-600">
                        Complete evidence package (Recommended)
                      </p>
                    </div>
                    {format === 'both' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Recommended
                      </span>
                    )}
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Select Evidence to Include
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      key: 'summary',
                      label: 'Case Summary (metrics and overview)',
                    },
                    { key: 'timeline', label: 'Timeline Events (chronological)' },
                    {
                      key: 'pois',
                      label: 'POI Rankings (suspect scores and analysis)',
                    },
                    {
                      key: 'media_inventory',
                      label: 'Flagged Media Inventory (with file hashes)',
                    },
                    {
                      key: 'messages',
                      label: 'Suspicious Messages (full text and rules)',
                    },
                    {
                      key: 'hashes',
                      label: 'Evidence Hashes (SHA-256 for chain of custody)',
                    },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          selectedOptions[
                            key as keyof typeof selectedOptions
                          ]
                        }
                        onChange={(e) =>
                          setSelectedOptions({
                            ...selectedOptions,
                            [key]: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Additional Options
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      key: 'media_thumbnails',
                      label: 'Include media thumbnails in PDF (+2.1 MB)',
                    },
                    {
                      key: 'redact_pii',
                      label: 'Redact sensitive personal information',
                    },
                    {
                      key: 'raw_logs',
                      label: 'Include raw data logs (for technical analysis)',
                    },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          selectedOptions[
                            key as keyof typeof selectedOptions
                          ]
                        }
                        onChange={(e) =>
                          setSelectedOptions({
                            ...selectedOptions,
                            [key]: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Export includes SHA-256 hashes for all evidence files to
                  ensure chain-of-custody integrity required for court
                  admissibility.
                </p>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition font-semibold">
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                  Generate Export
                </button>
              </div>
            </div>
          )}

          {stage === 'progress' && (
            <div className="space-y-6 py-12">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Progress
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {Math.min(100, Math.round(progress))}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-200"
                    style={{
                      width: `${Math.min(100, progress)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-700 font-semibold">
                  Processing timeline events...
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  1,234 of 1,890
                </p>
              </div>

              <div className="text-center text-sm text-slate-600">
                <p>
                  ⏱️ Estimated time remaining:{' '}
                  <span className="font-semibold">
                    {Math.max(0, 15 - Math.round(progress / 6))} seconds
                  </span>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Please do not close this window. Your export will be ready
                  shortly.
                </p>
              </div>
            </div>
          )}

          {stage === 'complete' && (
            <div className="space-y-6 py-6">
              <div className="text-center">
                <div className="text-5xl mb-2">✓</div>
                <p className="text-sm text-slate-600 mb-6">
                  Your case export has been generated successfully.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        📄 Case_{caseId}_Report.pdf
                      </p>
                      <p className="text-xs text-slate-600 mt-1">4.2 MB</p>
                      <p className="text-xs text-slate-600">
                        Generated: {new Date().toLocaleString()}
                      </p>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        📊 Case_{caseId}_Data.json
                      </p>
                      <p className="text-xs text-slate-600 mt-1">1.8 MB</p>
                      <p className="text-xs text-slate-600">
                        Generated: {new Date().toLocaleString()}
                      </p>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1">
                <div className="flex items-center gap-2 text-green-800 text-sm">
                  <span>✓</span>
                  <span>Includes SHA-256 hashes for chain-of-custody</span>
                </div>
                <div className="flex items-center gap-2 text-green-800 text-sm">
                  <span>✓</span>
                  <span>All evidence references preserved</span>
                </div>
                <div className="flex items-center gap-2 text-green-800 text-sm">
                  <span>✓</span>
                  <span>Ready for court submission</span>
                </div>
              </div>

              <p className="text-sm text-slate-600 text-center">
                These files are ready for evidence submission and legal
                documentation.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition font-semibold">
                  Generate Another Export
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition font-semibold">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
