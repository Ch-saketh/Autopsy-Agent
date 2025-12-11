import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { Media } from '../types';
import { mockSummary } from '../mockData';

interface MediaGalleryProps {
  onNavigate: (view: string, data?: any) => void;
  onBack: () => void;
}

export function MediaGallery({ onNavigate, onBack }: MediaGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([
    'nsfw',
    'weapon',
    'violence',
    'other',
  ]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(50);
  const media = mockSummary.flagged_media_snapshot;

  const filteredMedia = media.filter((m) => {
    const hasSelectedLabel = m.labels.some(
      (l) => selectedLabels.includes(l.label) && l.confidence * 100 >= confidenceThreshold
    );
    return hasSelectedLabel;
  });

  const labelCounts = {
    nsfw: media.filter((m) => m.labels.some((l) => l.label === 'nsfw')).length,
    weapon: media.filter((m) => m.labels.some((l) => l.label === 'weapon'))
      .length,
    violence: media.filter((m) => m.labels.some((l) => l.label === 'violence'))
      .length,
    other: media.filter((m) => m.labels.some((l) => l.label === 'other')).length,
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'border-4 border-red-500';
      case 'high':
        return 'border-2 border-orange-500';
      case 'medium':
        return 'border border-amber-500';
      default:
        return 'border border-slate-300';
    }
  };

  const labelColor = {
    nsfw: 'bg-red-600',
    weapon: 'bg-orange-600',
    violence: 'bg-red-800',
    other: 'bg-slate-600',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">
              Flagged Media Gallery
            </h1>
            <button
              onClick={onBack}
              className="text-slate-600 hover:text-slate-900 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Content Labels
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(labelColor).map(([label, color]) => (
                  <button
                    key={label}
                    onClick={() => {
                      if (selectedLabels.includes(label)) {
                        setSelectedLabels(selectedLabels.filter((l) => l !== label));
                      } else {
                        setSelectedLabels([...selectedLabels, label]);
                      }
                    }}
                    className={`px-3 py-1 rounded text-white text-sm font-semibold transition ${
                      selectedLabels.includes(label)
                        ? color
                        : 'bg-slate-300'
                    }`}
                  >
                    {label.toUpperCase()}{' '}
                    <span className="text-xs opacity-75">
                      ({labelCounts[label as keyof typeof labelCounts]})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Confidence Threshold
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-semibold text-slate-900 w-12">
                  {confidenceThreshold}%+
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-4">
            Showing {filteredMedia.length} flagged items
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((mediaItem) => (
            <div
              key={mediaItem.id}
              onClick={() => setSelectedMedia(mediaItem)}
              className={`relative rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition group ${getRiskColor(mediaItem.risk_level)}`}
            >
              <div className="relative h-32">
                <img
                  src={mediaItem.thumbnail_url}
                  alt="media"
                  className="w-full h-full object-cover blur-sm"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <span className="text-white text-sm font-semibold">
                    Click to view
                  </span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="flex flex-wrap gap-1">
                  {mediaItem.labels.map((label) => (
                    <span
                      key={label.label}
                      className={`text-xs px-2 py-1 ${labelColor[label.label as keyof typeof labelColor]} text-white rounded`}
                    >
                      {label.label.toUpperCase()}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-white mt-1">
                  {mediaItem.labels[0]?.confidence
                    ? `${(mediaItem.labels[0].confidence * 100).toFixed(0)}%`
                    : 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {selectedMedia && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Media Evidence Detail</h2>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex justify-center bg-slate-100 p-4 rounded">
                  <img
                    src={selectedMedia.thumbnail_url}
                    alt="media"
                    className="max-h-64 object-contain rounded"
                  />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-3">
                    Detection Results
                  </h3>
                  <div className="space-y-3">
                    {selectedMedia.labels.map((label) => (
                      <div key={label.label} className="bg-slate-50 p-3 rounded border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-900">
                            {label.label.toUpperCase()}
                          </span>
                          <span className="text-sm font-bold text-slate-700">
                            {(label.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${label.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    File Information
                  </h3>
                  <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
                    <div>
                      <span className="font-semibold">Filename:</span>{' '}
                      {selectedMedia.file_name}
                    </div>
                    <div>
                      <span className="font-semibold">Size:</span>{' '}
                      {(selectedMedia.file_size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <div>
                      <span className="font-semibold">Timestamp:</span>{' '}
                      {new Date(selectedMedia.timestamp).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-semibold">SHA-256:</span>{' '}
                      <code className="text-xs font-mono bg-white p-1 rounded">
                        {selectedMedia.sha256}
                      </code>
                    </div>
                  </div>
                </div>

                {selectedMedia.linked_contacts.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">
                      Linked Contacts
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMedia.linked_contacts.map((contact) => (
                        <span
                          key={contact.id}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm cursor-pointer hover:bg-blue-200 transition"
                        >
                          {contact.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={() => onNavigate('timeline')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold"
                  >
                    View on Timeline
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-900 rounded hover:bg-slate-300 transition text-sm font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
