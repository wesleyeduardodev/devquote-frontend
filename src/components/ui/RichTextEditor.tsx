import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Undo, Redo } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { inlineImageService } from '@/services/inlineImageService';

interface RichTextEditorProps {
    value?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    label?: string;
    required?: boolean;
    minHeight?: string;
    context?: string;
}

const convertPlainTextToHtml = (text: string): string => {
    if (!text || text.trim() === '') return '';

    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(text);
    if (hasHtmlTags) return text;

    const paragraphs = text.split(/\n\n+/);

    return paragraphs
        .map(paragraph => {
            const lines = paragraph.split(/\n/);
            const content = lines.join('<br>');
            return `<p>${content}</p>`;
        })
        .join('');
};

const MenuButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}> = ({ onClick, isActive, disabled, title, children }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={clsx(
            'p-1.5 rounded transition-colors',
            isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100',
            disabled && 'opacity-50 cursor-not-allowed'
        )}
    >
        {children}
    </button>
);

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value = '',
    onChange,
    placeholder = 'Digite aqui...',
    disabled = false,
    error,
    label,
    required,
    minHeight = '200px',
    context = 'general',
}) => {
    const [isUploading, setIsUploading] = React.useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                codeBlock: false,
            }),
            Image.configure({
                inline: true,
                allowBase64: false,
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg my-2',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline hover:text-blue-800',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: convertPlainTextToHtml(value),
        editable: !disabled,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const isEmpty = editor.isEmpty;
            onChange?.(isEmpty ? '' : html);
        },
        editorProps: {
            attributes: {
                class: clsx(
                    'prose prose-sm max-w-none focus:outline-none',
                    'min-h-[inherit] px-3 py-2'
                ),
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items;
                if (!items) return false;

                for (const item of items) {
                    if (item.type.startsWith('image/')) {
                        event.preventDefault();
                        const file = item.getAsFile();
                        if (file) {
                            handleImageUpload(file);
                        }
                        return true;
                    }
                }
                return false;
            },
            handleDrop: (view, event) => {
                const files = event.dataTransfer?.files;
                if (!files || files.length === 0) return false;

                const file = files[0];
                if (file.type.startsWith('image/')) {
                    event.preventDefault();
                    handleImageUpload(file);
                    return true;
                }
                return false;
            },
        },
    });

    useEffect(() => {
        if (editor) {
            const convertedValue = convertPlainTextToHtml(value);
            const currentContent = editor.getHTML();
            const isEmpty = editor.isEmpty;

            if (value === '' && isEmpty) return;
            if (convertedValue === currentContent) return;

            editor.commands.setContent(convertedValue);
        }
    }, [value, editor]);

    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [disabled, editor]);

    const handleImageUpload = useCallback(async (file: File) => {
        if (!editor) return;

        if (!inlineImageService.isValidImageType(file)) {
            toast.error('Tipo de imagem nao suportado. Use JPEG, PNG, GIF ou WebP.');
            return;
        }

        const maxSize = inlineImageService.getMaxFileSize();
        if (file.size > maxSize) {
            toast.error('Imagem muito grande. Tamanho maximo: 5MB.');
            return;
        }

        setIsUploading(true);
        const loadingToast = toast.loading('Enviando imagem...');

        try {
            const compressedFile = await inlineImageService.compressImage(file);
            const response = await inlineImageService.uploadImage(compressedFile, context);

            editor.chain().focus().setImage({ src: response.url }).run();

            toast.dismiss(loadingToast);
            toast.success('Imagem adicionada com sucesso!');
        } catch (error: any) {
            toast.dismiss(loadingToast);
            toast.error(error?.userMessage || 'Erro ao enviar imagem. Tente novamente.');
            console.error('Error uploading image:', error);
        } finally {
            setIsUploading(false);
        }
    }, [editor, context]);

    const handleImageButtonClick = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/gif,image/webp';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                handleImageUpload(file);
            }
        };
        input.click();
    }, [handleImageUpload]);

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL do link:', previousUrl);

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div
                className={clsx(
                    'border rounded-lg overflow-hidden transition-colors',
                    error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white',
                    disabled && 'bg-gray-50 cursor-not-allowed'
                )}
            >
                <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        disabled={disabled || isUploading}
                        title="Negrito (Ctrl+B)"
                    >
                        <Bold className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        disabled={disabled || isUploading}
                        title="Italico (Ctrl+I)"
                    >
                        <Italic className="w-4 h-4" />
                    </MenuButton>
                    <div className="w-px h-5 bg-gray-300 mx-1" />
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        disabled={disabled || isUploading}
                        title="Lista com marcadores"
                    >
                        <List className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        disabled={disabled || isUploading}
                        title="Lista numerada"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </MenuButton>
                    <div className="w-px h-5 bg-gray-300 mx-1" />
                    <MenuButton
                        onClick={setLink}
                        isActive={editor.isActive('link')}
                        disabled={disabled || isUploading}
                        title="Inserir link"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={handleImageButtonClick}
                        disabled={disabled || isUploading}
                        title="Inserir imagem (ou cole com Ctrl+V)"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </MenuButton>
                    <div className="w-px h-5 bg-gray-300 mx-1" />
                    <MenuButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={disabled || isUploading || !editor.can().undo()}
                        title="Desfazer (Ctrl+Z)"
                    >
                        <Undo className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={disabled || isUploading || !editor.can().redo()}
                        title="Refazer (Ctrl+Y)"
                    >
                        <Redo className="w-4 h-4" />
                    </MenuButton>
                    {isUploading && (
                        <span className="ml-auto text-xs text-gray-500">Enviando imagem...</span>
                    )}
                </div>
                <div
                    style={{ minHeight }}
                    className={clsx(
                        'cursor-text',
                        disabled && 'pointer-events-none opacity-60'
                    )}
                    onClick={() => editor.chain().focus().run()}
                >
                    <EditorContent editor={editor} />
                </div>
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            <p className="mt-1 text-xs text-gray-500">
                Dica: Cole imagens diretamente com Ctrl+V ou arraste e solte.
            </p>
        </div>
    );
};

export default RichTextEditor;
