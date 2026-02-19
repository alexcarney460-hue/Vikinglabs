'use client';

import { useState } from 'react';

interface VideoUploadFormProps {
  contentId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function VideoUploadForm({ contentId, onSuccess, onError }: VideoUploadFormProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [useStoredCredentials, setUseStoredCredentials] = useState(true);
  const [igUsername, setIgUsername] = useState('');
  const [igPassword, setIgPassword] = useState('');

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!videoFile) {
        throw new Error('Please select a video file');
      }

      const formData = new FormData();
      formData.append('videoFile', videoFile);
      formData.append('contentId', contentId);

      if (!useStoredCredentials) {
        if (!igUsername || !igPassword) {
          throw new Error('Please provide Instagram credentials');
        }
        formData.append('igUsername', igUsername);
        formData.append('igPassword', igPassword);
      }

      const res = await fetch('/api/admin/marketing/content/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const result = await res.json();
      onSuccess();
      setVideoFile(null);
      setIgUsername('');
      setIgPassword('');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h3 className="font-semibold text-amber-900">Upload & Post Video</h3>
      
      <form onSubmit={handleUpload} className="mt-4 space-y-4">
        {/* Video File Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Video File (MP4, MOV, etc.)
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            disabled={loading}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700"
          />
          {videoFile && (
            <p className="mt-1 text-sm text-slate-600">
              Selected: {videoFile.name}
            </p>
          )}
        </div>

        {/* Credentials Section */}
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useStoredCredentials}
              onChange={(e) => setUseStoredCredentials(e.target.checked)}
              disabled={loading}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Use stored Instagram credentials</span>
          </label>

          {!useStoredCredentials && (
            <>
              <input
                type="text"
                placeholder="Instagram username"
                value={igUsername}
                onChange={(e) => setIgUsername(e.target.value)}
                disabled={loading}
                className="block w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder="Instagram password"
                value={igPassword}
                onChange={(e) => setIgPassword(e.target.value)}
                disabled={loading}
                className="block w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!videoFile || loading}
          className="w-full rounded bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? 'Uploading & Posting...' : 'Upload & Post to Instagram'}
        </button>
      </form>
    </div>
  );
}
