import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Link as LinkIcon,
    Image as ImageIcon,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Code,
    Minus,
    Table as TableIcon,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    CheckSquare,
    Palette,
    Highlighter,
    ChevronDown,
    Plus,
    Trash2,
} from 'lucide-react';
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

const TEXT_COLORS = [
    { name: 'Preto', color: '#000000' },
    { name: 'Cinza', color: '#6B7280' },
    { name: 'Vermelho', color: '#DC2626' },
    { name: 'Laranja', color: '#EA580C' },
    { name: 'Amarelo', color: '#CA8A04' },
    { name: 'Verde', color: '#16A34A' },
    { name: 'Azul', color: '#2563EB' },
    { name: 'Roxo', color: '#9333EA' },
    { name: 'Rosa', color: '#DB2777' },
];

const HIGHLIGHT_COLORS = [
    { name: 'Amarelo', color: '#FEF08A' },
    { name: 'Verde', color: '#BBF7D0' },
    { name: 'Azul', color: '#BFDBFE' },
    { name: 'Rosa', color: '#FBCFE8' },
    { name: 'Roxo', color: '#DDD6FE' },
    { name: 'Laranja', color: '#FED7AA' },
];

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

const Divider = () => <div className="w-px h-5 bg-gray-300 mx-1" />;

const ColorPicker: React.FC<{
    colors: { name: string; color: string }[];
    onSelect: (color: string) => void;
    onClear?: () => void;
    title: string;
    icon: React.ReactNode;
    disabled?: boolean;
    currentColor?: string;
}> = ({ colors, onSelect, onClear, title, icon, disabled, currentColor }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                title={title}
                className={clsx(
                    'p-1.5 rounded transition-colors flex items-center gap-0.5',
                    'text-gray-600 hover:bg-gray-100',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                {icon}
                <ChevronDown className="w-3 h-3" />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 min-w-[120px]">
                        <div className="grid grid-cols-3 gap-1">
                            {colors.map(({ name, color }) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => {
                                        onSelect(color);
                                        setIsOpen(false);
                                    }}
                                    title={name}
                                    className={clsx(
                                        'w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform',
                                        currentColor === color && 'ring-2 ring-blue-500'
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        {onClear && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClear();
                                    setIsOpen(false);
                                }}
                                className="w-full mt-2 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Remover
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const TableMenu: React.FC<{
    editor: any;
    disabled?: boolean;
}> = ({ editor, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);

    const insertTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                title="Tabela"
                className={clsx(
                    'p-1.5 rounded transition-colors flex items-center gap-0.5',
                    editor.isActive('table') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                <TableIcon className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 min-w-[160px]">
                        {!editor.isActive('table') ? (
                            <button
                                type="button"
                                onClick={insertTable}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Inserir Tabela 3x3
                            </button>
                        ) : (
                            <div className="space-y-1">
                                <button
                                    type="button"
                                    onClick={() => { editor.chain().focus().addColumnAfter().run(); setIsOpen(false); }}
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 rounded"
                                >
                                    Adicionar coluna
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { editor.chain().focus().addRowAfter().run(); setIsOpen(false); }}
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 rounded"
                                >
                                    Adicionar linha
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { editor.chain().focus().deleteColumn().run(); setIsOpen(false); }}
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 rounded text-red-600"
                                >
                                    Remover coluna
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { editor.chain().focus().deleteRow().run(); setIsOpen(false); }}
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 rounded text-red-600"
                                >
                                    Remover linha
                                </button>
                                <hr className="my-1" />
                                <button
                                    type="button"
                                    onClick={() => { editor.chain().focus().deleteTable().run(); setIsOpen(false); }}
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 rounded text-red-600 flex items-center gap-2"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Excluir tabela
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

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
                heading: {
                    levels: [1, 2, 3],
                },
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
            Underline,
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Subscript,
            Superscript,
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse table-auto w-full',
                },
            }),
            TableRow,
            TableCell.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 p-2',
                },
            }),
            TableHeader.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 p-2 bg-gray-100 font-bold',
                },
            }),
            TaskList.configure({
                HTMLAttributes: {
                    class: 'list-none pl-0',
                },
            }),
            TaskItem.configure({
                nested: true,
                HTMLAttributes: {
                    class: 'flex items-start gap-2',
                },
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
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
                    {/* Formatacao basica */}
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
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive('underline')}
                        disabled={disabled || isUploading}
                        title="Sublinhado (Ctrl+U)"
                    >
                        <UnderlineIcon className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive('strike')}
                        disabled={disabled || isUploading}
                        title="Riscado"
                    >
                        <Strikethrough className="w-4 h-4" />
                    </MenuButton>

                    <Divider />

                    {/* Cores */}
                    <ColorPicker
                        colors={TEXT_COLORS}
                        onSelect={(color) => editor.chain().focus().setColor(color).run()}
                        onClear={() => editor.chain().focus().unsetColor().run()}
                        title="Cor do texto"
                        icon={<Palette className="w-4 h-4" />}
                        disabled={disabled || isUploading}
                        currentColor={editor.getAttributes('textStyle').color}
                    />
                    <ColorPicker
                        colors={HIGHLIGHT_COLORS}
                        onSelect={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
                        onClear={() => editor.chain().focus().unsetHighlight().run()}
                        title="Marca-texto"
                        icon={<Highlighter className="w-4 h-4" />}
                        disabled={disabled || isUploading}
                    />

                    <Divider />

                    {/* Alinhamento */}
                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        isActive={editor.isActive({ textAlign: 'left' })}
                        disabled={disabled || isUploading}
                        title="Alinhar a esquerda"
                    >
                        <AlignLeft className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        isActive={editor.isActive({ textAlign: 'center' })}
                        disabled={disabled || isUploading}
                        title="Centralizar"
                    >
                        <AlignCenter className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        isActive={editor.isActive({ textAlign: 'right' })}
                        disabled={disabled || isUploading}
                        title="Alinhar a direita"
                    >
                        <AlignRight className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                        isActive={editor.isActive({ textAlign: 'justify' })}
                        disabled={disabled || isUploading}
                        title="Justificar"
                    >
                        <AlignJustify className="w-4 h-4" />
                    </MenuButton>

                    <Divider />

                    {/* Listas */}
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        isActive={editor.isActive('taskList')}
                        disabled={disabled || isUploading}
                        title="Lista de tarefas"
                    >
                        <CheckSquare className="w-4 h-4" />
                    </MenuButton>

                    <Divider />

                    {/* Blocos */}
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        isActive={editor.isActive('code')}
                        disabled={disabled || isUploading}
                        title="Codigo"
                    >
                        <Code className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        disabled={disabled || isUploading}
                        title="Linha horizontal"
                    >
                        <Minus className="w-4 h-4" />
                    </MenuButton>

                    <Divider />

                    {/* Subscrito/Sobrescrito */}
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleSubscript().run()}
                        isActive={editor.isActive('subscript')}
                        disabled={disabled || isUploading}
                        title="Subscrito"
                    >
                        <SubscriptIcon className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleSuperscript().run()}
                        isActive={editor.isActive('superscript')}
                        disabled={disabled || isUploading}
                        title="Sobrescrito"
                    >
                        <SuperscriptIcon className="w-4 h-4" />
                    </MenuButton>

                    <Divider />

                    {/* Tabela */}
                    <TableMenu editor={editor} disabled={disabled || isUploading} />

                    <Divider />

                    {/* Links e Imagens */}
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

                    <Divider />

                    {/* Undo/Redo */}
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

                {/* Editor Content */}
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
