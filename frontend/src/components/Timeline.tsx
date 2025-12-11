import React, { useState } from 'react';
import {
  MessageSquare,
  Image,
  Phone,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TimelineEvent } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
  onNavigate: (view: string, data?: any) => void;
  onBack: () => void;
}

export function Timeline({ events, onNavigate, onBack }: TimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'message',
    'media_flag',
    'call',
    'app_activity',
  ]);

  const filteredEvents = events.filter((e) => {
    if (showSuspiciousOnly && !e.suspicious) return false;
    if (!selectedTypes.includes(e.type)) return false;
    return true;
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-amber-500 bg-amber-50';
      default:
        return 'border-slate-300 bg-slate-50';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'media_flag':
        return <Image className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const typeLabel = {
    message: 'Messages',
    media_flag: 'Media',
    call: 'Calls',
    app_activity: 'App Activity',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">
              Event Timeline
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Filter Events</h3>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                Event Type
              </h4>
              <div className="space-y-2">
                {Object.entries(typeLabel).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTypes([...selectedTypes, key]);
                        } else {
                          setSelectedTypes(
                            selectedTypes.filter((t) => t !== key)
                          );
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">
                      {label}{' '}
                      <span className="text-slate-500">
                        (
                        {events.filter((e) => e.type === key).length})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pb-6 border-b border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSuspiciousOnly}
                  onChange={(e) => setShowSuspiciousOnly(e.target.checked)}
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-700">
                    Show Only Suspicious
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    {
                      events.filter((e) => e.suspicious && selectedTypes.includes(e.type)).length
                    }{' '}
                    of {events.filter((e) => selectedTypes.includes(e.type)).length}
                  </p>
                </div>
              </label>
            </div>

            <button
              onClick={() => {
                setSelectedTypes(['message', 'media_flag', 'call', 'app_activity']);
                setShowSuspiciousOnly(false);
              }}
              className="mt-4 w-full text-sm text-slate-600 hover:text-slate-900 py-2 border border-slate-200 rounded hover:bg-slate-50 transition"
            >
              Reset Filters
            </button>
          </div>

          <div className="md:col-span-3 space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="bg-white p-12 rounded-lg border border-slate-200 text-center">
                <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">
                  No events match your filters
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`bg-white border-l-4 rounded-lg p-4 cursor-pointer hover:shadow-md transition ${getRiskColor(event.risk_level)}`}
                >
                  <div
                    onClick={() =>
                      setExpandedEvent(
                        expandedEvent === event.id ? null : event.id
                      )
                    }
                    className="flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getTypeIcon(event.type)}
                        <span className="text-sm text-slate-600">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                        {event.suspicious && (
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${getRiskBadgeColor(event.risk_level)}`}
                          >
                            {event.risk_level.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900">
                        {event.label}
                      </h3>
                      {event.preview && (
                        <p className="text-sm text-slate-600 mt-1">
                          {event.preview}
                        </p>
                      )}
                    </div>
                    {expandedEvent === event.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  {expandedEvent === event.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                        <h4 className="text-sm font-bold text-yellow-900 mb-2">
                          Why Suspicious?
                        </h4>
                        <div className="space-y-1 text-sm text-yellow-800">
                          {event.explain.rules_triggered && (
                            <div>
                              <span className="font-semibold">Rules: </span>
                              {event.explain.rules_triggered.join(', ')}
                            </div>
                          )}
                          {event.explain.labels && (
                            <div>
                              <span className="font-semibold">Labels: </span>
                              {event.explain.labels.join(', ')}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold">Confidence: </span>
                            {(event.explain.confidence * 100).toFixed(0)}%
                          </div>
                          <div>
                            <span className="font-semibold">Model: </span>
                            {event.explain.model}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {event.evidence_refs.message_ids.length > 0 && (
                          <button
                            onClick={() => onNavigate('chat')}
                            className="block w-full text-left text-sm px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100 transition"
                          >
                            View Linked Messages →
                          </button>
                        )}
                        {event.evidence_refs.media_ids.length > 0 && (
                          <button
                            onClick={() => onNavigate('media')}
                            className="block w-full text-left text-sm px-3 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded hover:bg-orange-100 transition"
                          >
                            View Linked Media →
                          </button>
                        )}
                        {event.evidence_refs.contact_ids.length > 0 && (
                          <button
                            onClick={() => onNavigate('poi')}
                            className="block w-full text-left text-sm px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded hover:bg-purple-100 transition"
                          >
                            View Related POI →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
