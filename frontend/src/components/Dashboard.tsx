import React, { useRef, useState } from 'react';
import {
  MessageSquare,
  Image,
  Users,
  AlertTriangle,
  Shield,
  UserCheck,
  Download,
  Calendar,
  Upload,
} from 'lucide-react';
import { Summary } from '../types';

interface DashboardProps {
  summary: Summary;
  onNavigate: (view: string, data?: any) => void;
}

export function Dashboard({ summary, onNavigate }: DashboardProps) {
  const { summary: stats, top_pois, flagged_media_snapshot } = summary;

  // upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-50 border-red-200';
    if (score >= 60) return 'bg-orange-50 border-orange-200';
    return 'bg-amber-50 border-amber-200';
  };

  const getRiskTextColor = (score: number) => {
    if (score >= 80) return 'text-red-700';
    if (score >= 60) return 'text-orange-700';
    return 'text-amber-700';
  };

  const getRiskBarColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-amber-500';
  };

  // --- helpers ---
  const isAccepted = (_file: File) => {
    // Accept any file type on the client. Specific validation (mime, magic bytes)
    // should be handled by the backend if required.
    return true;
  };

  const handleFileSelect = (file?: File) => {
    setUploadError(null);
    setSelectedFileName(null);

    if (!file) return;

    if (!isAccepted(file)) {
      setUploadError('This file type is not accepted.');
      return;
    }

    // Optional: enforce a reasonable max size (example: 500MB). Adjust as needed.
    const MAX_BYTES = 500 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setUploadError('File too large. Please upload a file smaller than 500MB.');
      return;
    }

    setSelectedFileName(file.name);

    // Hand off to parent/handler for processing. The parent can parse or upload file.
    onNavigate('importFile', { file });
  };

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) handleFileSelect(f);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = () => {
    setIsDragging(false);
  };

  // Eye icon component
  const Eye = ({ className }: { className?: string }) => {
    return (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Investigation Cockpit</h1>
              <p className="text-slate-600 mt-1">Case #{summary.case_id} • {summary.device_owner}</p>
            </div>

            {/* Right-side actions including upload */}
            <div className="flex gap-3 items-center">
              <div className="text-sm text-slate-500 mr-2 hidden sm:block">Import File</div>

              <div className="relative">
                <button
                  onClick={openFilePicker}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={onInputChange}
                  className="hidden"
                  aria-hidden="true"
                />
              </div>

              <button
                onClick={() => onNavigate('export')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="w-4 h-4" />
                Export Case
              </button>

              <button
                onClick={() => onNavigate('timeline')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition"
              >
                <Calendar className="w-4 h-4" />
                Open Timeline
              </button>
            </div>
          </div>

          {/* Brief feedback about selected file */}
          <div className="mt-3">
            {selectedFileName && (
              <div className="inline-flex items-center gap-3 px-3 py-2 bg-white border border-slate-200 rounded-md">
                <Upload className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-700">{selectedFileName}</span>
                <button
                  onClick={() => {
                    setSelectedFileName(null);
                    setUploadError(null);
                  }}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            {uploadError && (
              <div className="mt-2 text-sm text-red-600">{uploadError}</div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Drag and drop area for files */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mb-6 p-4 rounded-lg border-2 transition ${
            isDragging ? 'border-dashed border-green-500 bg-green-50' : 'border-transparent'
          }`}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Insert / Upload File</h4>
              <p className="text-xs text-slate-600 mt-1">
                Drop any file here or click "Upload File". All file types are accepted on the client; server-side validation is recommended.
              </p>
            </div>

            <div>
              <button
                onClick={openFilePicker}
                className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:shadow transition"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Messages</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_messages.toLocaleString()}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Media Files</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_media.toLocaleString()}</p>
              </div>
              <Image className="w-8 h-8 text-slate-300" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Contacts Found</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_contacts}</p>
              </div>
              <Users className="w-8 h-8 text-slate-300" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div
            onClick={() => onNavigate('media')}
            className="bg-red-50 border border-red-200 p-6 rounded-lg hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-700 text-sm font-medium">Flagged Media Items</p>
                <p className="text-3xl font-bold text-red-700 mt-1">{stats.flagged_media}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('chat')}
            className="bg-orange-50 border border-orange-200 p-6 rounded-lg hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 text-sm font-medium">Suspicious Messages</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">{stats.suspicious_messages}</p>
              </div>
              <Shield className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('poi')}
            className="bg-blue-50 border border-blue-200 p-6 rounded-lg hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-medium">Persons of Interest</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{stats.poi_count}</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Top Ranked POIs</h2>
            <div className="space-y-3">
              {top_pois.slice(0, 3).map((poi, idx) => (
                <div
                  key={poi.id}
                  onClick={() => onNavigate('poi', { selectedPOI: poi })}
                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition ${getRiskColor(poi.score)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-600">#{idx + 1}</span>
                        <h3 className="font-bold text-slate-900">{poi.name}</h3>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{poi.phone}</p>
                      <div className="mt-2 flex gap-3 text-xs text-slate-600">
                        <span>
                          {poi.feature_breakdown.suspicious_msg_count} suspicious msgs
                        </span>
                        <span>
                          {poi.feature_breakdown.flagged_media_assoc} flagged media
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${getRiskTextColor(poi.score)}`}>{poi.score}%</p>
                      <div className="w-16 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full ${getRiskBarColor(poi.score)}`}
                          style={{ width: `${poi.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Flagged Media Preview</h2>
            <div className="grid grid-cols-3 gap-3">
              {flagged_media_snapshot.slice(0, 6).map((media) => (
                <div
                  key={media.id}
                  onClick={() => onNavigate('media', { selectedMedia: media })}
                  className="group relative rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition"
                >
                  <img
                    src={media.thumbnail_url}
                    alt="media"
                    className="w-full h-24 object-cover group-hover:opacity-75 transition"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <div className="flex flex-wrap gap-1">
                      {media.labels.map((label) => (
                        <span key={label.label} className="text-xs px-2 py-1 bg-red-500 text-white rounded">{label.label.toUpperCase()}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">How Sherlock Agent Solves Data Overload</h3>
          <p className="text-sm text-blue-800">
            Mobile phones contain thousands of messages, images, and hidden interactions. Sherlock Agent uses AI-powered media scanning, NLP-based message analysis, and behavioral anomaly detection to surface critical evidence in minutes—not days. Stop scrolling through noise. Start finding criminals.
          </p>
        </div>
      </div>
    </div>
  );
}