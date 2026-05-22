/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Bold, Italic, Underline, List, Heading, Edit3, Check, Trash2 } from "lucide-react";

interface RichTextEditorProps {
  id: string;
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  label?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = "Escreva aqui...",
  label,
  readOnly = false
}: RichTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tagOpen: string, tagClose: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(startPos, endPos);
    const replacement = tagOpen + (selectedText || "") + tagClose;

    const newValue = text.substring(0, startPos) + replacement + text.substring(endPos);
    onChange(newValue);

    // Reposition cursor inside/after tag
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + tagOpen.length + (selectedText ? selectedText.length : 0) + tagClose.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleClear = () => {
    if (confirm("Deseja limpar todo o texto deste campo?")) {
      onChange("");
    }
  };

  // Safe HTML processing to avoid layout break
  const renderFormattedHtml = (html: string) => {
    if (!html || html.trim() === "") {
      return `<p class="text-neutral-500 italic font-light">${placeholder}</p>`;
    }
    return html;
  };

  return (
    <div id={`${id}-container`} className="flex flex-col w-full text-left font-sans">
      {label && (
        <label className="text-xs uppercase font-semibold text-neutral-400 tracking-wider mb-1 flex items-center justify-between">
          <span>{label}</span>
          {!readOnly && (
            <button
              id={`${id}-toggle-btn`}
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`text-xs px-2 py-0.5 rounded transition ${
                isEditing
                  ? "bg-paranormal-red/20 text-paranormal-red hover:bg-paranormal-red/30"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              {isEditing ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3  h-3" /> Concluir
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Editar
                </span>
              )}
            </button>
          )}
        </label>
      )}

      {isEditing && !readOnly ? (
        <div className="border border-paranormal-border rounded-lg bg-black overflow-hidden focus-within:border-paranormal-red/60 transition duration-300">
          {/* Format toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-950 border-b border-paranormal-border">
            <button
              type="button"
              onClick={() => insertTag("<strong>", "</strong>")}
              title="Negrito"
              className="p-1 px-2 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTag("<em>", "</em>")}
              title="Itálico"
              className="p-1 px-2 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTag("<u>", "</u>")}
              title="Sublinhado"
              className="p-1 px-2 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
            >
              <Underline className="w-4 h-4" />
            </button>
            <span className="w-px h-5 bg-neutral-800 mx-1" />
            <button
              type="button"
              onClick={() => insertTag("<h3>", "</h3>")}
              title="Título"
              className="p-1 px-2 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
            >
              <Heading className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTag("<ul><li>", "</li></ul>")}
              title="Lista"
              className="p-1 px-2 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTag("<li>", "</li>")}
              title="Novo Item da Lista"
              className="px-2 py-0.5 text-xs rounded hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800"
            >
              + Item
            </button>
            <button
              type="button"
              onClick={() => insertTag("<p>", "</p>")}
              title="Parágrafo"
              className="px-2 py-0.5 text-xs rounded hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800"
            >
              Parágrafo
            </button>
            <div className="ml-auto">
              <button
                type="button"
                onClick={handleClear}
                title="Limpar Campo"
                className="p-1 text-neutral-400 hover:text-paranormal-red hover:bg-neutral-900 rounded transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Typing Area */}
          <textarea
            id={`${id}-textarea`}
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black text-neutral-200 text-sm p-3 min-h-[140px] focus:outline-none font-sans leading-relaxed resize-y"
            placeholder="Insira as informações... Utilize a barra acima para estilizar. Tags HTML como <strong> <em> <u> <h3> <ul> e <li> são suportadas."
          />

          {/* Inline live preview */}
          <div className="bg-neutral-950/60 p-3 border-t border-paranormal-border/50">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">Prévia da Formatação:</span>
            <div 
              className="prose prose-sm prose-invert max-w-none text-xs text-neutral-300 leading-relaxed max-h-[100px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: renderFormattedHtml(value) }}
            />
          </div>
        </div>
      ) : (
        /* Preview Render Box */
        <div
          id={`${id}-preview-box`}
          onClick={() => {
            if (!readOnly) setIsEditing(true);
          }}
          className={`p-3 min-h-[100px] rounded-lg bg-paranormal-gray border text-sm text-neutral-200 hover:text-white leading-relaxed font-sans transition duration-200 ${
            readOnly
              ? "border-paranormal-border"
              : "border-paranormal-border hover:border-neutral-700 cursor-pointer hover:bg-paranormal-light-gray"
          }`}
        >
          <div
            className="prose prose-sm prose-invert max-w-none break-words text-neutral-300"
            style={{
              wordBreak: "break-word"
            }}
            dangerouslySetInnerHTML={{ __html: renderFormattedHtml(value) }}
          />
        </div>
      )}
    </div>
  );
}
