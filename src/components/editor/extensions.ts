import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { TableKit } from "@tiptap/extension-table";
import StarterKit from "@tiptap/starter-kit";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

const DocumentImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: "",
        parseHTML: (element) =>
          element.closest("figure")?.querySelector("figcaption")?.textContent ??
          "",
        renderHTML: () => ({}),
      },
      width: {
        default: "100%",
        parseHTML: (element) =>
          element.closest("figure")?.getAttribute("data-width") ?? "100%",
        renderHTML: () => ({}),
      },
      align: {
        default: "center",
        parseHTML: (element) =>
          element.closest("figure")?.getAttribute("data-align") ?? "center",
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const caption =
      typeof node.attrs.caption === "string" ? node.attrs.caption : "";
    const width =
      typeof node.attrs.width === "string" ? node.attrs.width : "100%";
    const align =
      typeof node.attrs.align === "string" ? node.attrs.align : "center";
    const children: unknown[] = [
      ["img", { ...HTMLAttributes, loading: "lazy" }],
    ];

    if (caption.trim()) {
      children.push([
        "figcaption",
        { class: "doc-image-caption" },
        caption,
      ]);
    }

    return [
      "figure",
      {
        class: "doc-image",
        "data-align": align,
        "data-width": width,
        style: `width: ${width}`,
      },
      ...children,
    ] as DOMOutputSpec;
  },
}).configure({
  inline: false,
  allowBase64: false,
});

export const editorExtensions = [
  StarterKit.configure({
    codeBlock: false,
    link: false,
    underline: false,
    heading: {
      levels: [1, 2, 3],
    },
  }),
  TextStyleKit,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Highlight.configure({
    multicolor: true,
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    autolink: true,
    protocols: ["http", "https", "mailto"],
    HTMLAttributes: {
      rel: "noopener noreferrer nofollow",
      target: "_blank",
    },
  }),
  TableKit.configure({
    table: {
      resizable: true,
    },
  }),
  DocumentImage,
  CodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: "plaintext",
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return "Título de sección";
      }

      return "Escribe algo, o pulsa “/” para insertar…";
    },
    showOnlyWhenEditable: true,
  }),
  CharacterCount,
  Typography,
  Superscript,
  Subscript,
];
