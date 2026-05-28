"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface RichEditorProps {
  content?: string;
  onChange?: (html: string, markdown: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  maxChars?: number;
  autofocus?: boolean;
}

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarBtn({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={cn(
        "px-2 py-1 rounded text-sm font-medium transition-colors select-none",
        active
          ? "bg-ink text-paper"
          : "text-ink/70 hover:bg-ink/10 hover:text-ink",
        disabled && "opacity-30 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

export function RichEditor({
  content = "",
  onChange,
  placeholder = "Write your story…",
  readOnly = false,
  className,
  maxChars = 100_000,
  autofocus = false,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: "rounded bg-ink/8 p-4 font-mono text-sm" } },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxChars }),
      Link.configure({ openOnClick: false, autolink: true }),
      Underline,
    ],
    content,
    editable: !readOnly,
    autofocus,
    onUpdate({ editor: e }) {
      onChange?.(e.getHTML(), e.getText());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3 text-ink",
      },
    },
  });

  // Sync external content changes (e.g. loading saved draft)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const chars = editor.storage.characterCount?.characters?.() ?? 0;

  return (
    <div className={cn("border border-ink/20 rounded-xl overflow-hidden bg-paper", className)}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-ink/10 bg-ink/2">
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <strong>B</strong>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <em>I</em>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
            <span className="underline">U</span>
          </ToolbarBtn>
          <div className="w-px h-4 bg-ink/15 mx-1" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2">
            H2
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3">
            H3
          </ToolbarBtn>
          <div className="w-px h-4 bg-ink/15 mx-1" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
            •—
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
            1.
          </ToolbarBtn>
          <div className="w-px h-4 bg-ink/15 mx-1" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
            {'"'}
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
            {"<>"}
          </ToolbarBtn>
          <ToolbarBtn onClick={setLink} active={editor.isActive("link")} title="Add link">
            🔗
          </ToolbarBtn>
          <div className="w-px h-4 bg-ink/15 mx-1" />
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            ↩
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            ↪
          </ToolbarBtn>
        </div>
      )}

      <EditorContent editor={editor} />

      {!readOnly && (
        <div className="flex justify-end px-4 py-1.5 border-t border-ink/8 bg-ink/2">
          <span className={cn("text-xs font-mono", chars > maxChars * 0.9 ? "text-orange-600" : "text-ink/40")}>
            {chars.toLocaleString()} / {maxChars.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
