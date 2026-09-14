import React, { useState, useRef } from 'react';
import { X, UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, Info } from 'lucide-react';
import axios from 'axios';
import JSZip from 'jszip';

export function GDPRModal({ isOpen, onClose, userId, onImportSuccess }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const validFiles = selectedFiles.filter(f => f.name.endsWith('.json') || f.name.endsWith('.zip'));
      if (validFiles.length === 0) {
        setError('Por favor, selecione arquivos válidos (.json ou .zip) exportados pelo Spotify.');
        return;
      }
      setFiles(validFiles);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);
    setProgressStatus('Lendo arquivos do Spotify...');

    try {
      let allStreams = [];

      for (const file of files) {
        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith('.zip')) {
          setProgressStatus(`Descompactando ${file.name}...`);
          const zip = await JSZip.loadAsync(file);
          const entries = Object.keys(zip.files);
          for (const entryName of entries) {
            if (entryName.match(/(endsong|streaming_history_audio|streaminghistory).*\.json$/i)) {
              const fileData = await zip.file(entryName).async('string');
              try {
                const parsed = JSON.parse(fileData);
                if (Array.isArray(parsed)) {
                  allStreams.push(...parsed);
                }
              } catch (parseErr) {
                console.warn(`Aviso ao ler ${entryName}:`, parseErr);
              }
            }
          }
        } else if (lowerName.endsWith('.json')) {
          const text = await file.text();
          try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
              allStreams.push(...parsed);
            }
          } catch (parseErr) {
            console.warn(`Aviso ao ler ${file.name}:`, parseErr);
          }
        }
      }

      if (allStreams.length === 0) {
        throw new Error('Nenhum dado válido de histórico (endsong_*.json ou Streaming_History_Audio_*.json) foi encontrado nos arquivos.');
      }

      // Enviar em lotes de 1500 reproduções (evita 100% o limite de 4.5MB da Vercel)
      const BATCH_SIZE = 1500;
      const totalBatches = Math.ceil(allStreams.length / BATCH_SIZE);
      let totalInserted = 0;
      let totalValid = 0;

      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const batch = allStreams.slice(start, start + BATCH_SIZE);
        const percent = Math.round(((i + 1) / totalBatches) * 100);
        setProgressStatus(`Importando: lote ${i + 1} de ${totalBatches} (${percent}%)...`);

        const res = await axios.post('/api/sync/gdpr-batch', { streams: batch }, {
          headers: { 'x-user-id': userId },
        });

        if (res.data) {
          totalInserted += res.data.inserted || 0;
          totalValid += res.data.validStreams || 0;
        }
      }

      setResult({
        validStreams: totalValid || allStreams.length,
        inserted: totalInserted,
      });

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      console.error('Erro na importação GDPR:', err);
      setError(err.response?.data?.error || err.message || 'Erro ao processar o arquivo. Verifique o formato.');
    } finally {
      setIsUploading(false);
      setProgressStatus('');
    }
  };

  const totalSizeMb = files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0e0e17] border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative">
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <UploadCloud size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Importar Histórico Vitalício</h2>
            <p className="text-xs text-emerald-400 font-semibold">Feito apenas 1 vez para liberar todos os anos</p>
          </div>
        </div>

        {/* Aviso de que é importação única */}
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-300/90 leading-relaxed">
          <Info size={16} className="shrink-0 text-emerald-400 mt-0.5" />
          <span>
            <strong>Importação Única:</strong> Você não precisa ficar importando todo mês! O arquivo GDPR preenche todos os anos e meses anteriores (2026, 2025, 2024...) de uma vez só no banco local. O app continuará sincronizando os meses futuros em tempo real.
          </span>
        </div>

        {/* Upload Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            files.length > 0
              ? 'border-emerald-500/60 bg-emerald-950/20'
              : 'border-white/15 hover:border-white/30 bg-white/5'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".json,.zip"
            onChange={handleFileChange}
            className="hidden"
          />

          {files.length > 0 ? (
            <div className="flex flex-col items-center">
              <FileText size={36} className="text-emerald-400 mb-2" />
              <p className="text-sm font-bold text-white truncate max-w-xs">
                {files.length === 1 ? files[0].name : `${files.length} arquivos selecionados`}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Total: {totalSizeMb.toFixed(2)} MB
              </p>
              <span className="text-[11px] text-emerald-400 font-semibold mt-2">Clique para trocar ou adicionar mais</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud size={36} className="text-zinc-400 mb-2" />
              <p className="text-sm font-bold text-zinc-200">Arraste o arquivo .ZIP ou os .JSONs do Spotify</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Aceita o <strong>.zip completo</strong> direto do e-mail ou arquivos <code className="text-zinc-400">endsong_*.json</code>
              </p>
            </div>
          )}
        </div>

        {/* Status do Progresso em Tempo Real */}
        {isUploading && progressStatus && (
          <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs animate-pulse">
            <Loader2 size={16} className="animate-spin text-emerald-400 shrink-0" />
            <span className="font-semibold">{progressStatus}</span>
          </div>
        )}

        {/* Feedback de Erro */}
        {error && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-red-300 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Feedback de Sucesso */}
        {result && (
          <div className="mt-4 p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 size={16} />
              <span>Importação Vitalícia Concluída!</span>
            </div>
            <p className="text-zinc-300 mt-1 leading-relaxed">
              Foram processadas <strong>{result.validStreams}</strong> reproduções válidas. Todos os meses históricos foram liberados no seletor!
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            {result ? 'Fechar' : 'Cancelar'}
          </button>

          {!result && (
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
              className="flex items-center gap-2 bg-[#1db954] hover:bg-[#1aa34a] text-black font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-lg transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              <span>{isUploading ? 'Importando Histórico...' : 'Iniciar Importação Única'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

