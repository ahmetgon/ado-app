import { openUrl } from "@tauri-apps/plugin-opener";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function DescriptionView({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(URL_REGEX);
  return (
    <p className="text-[13px] text-[#444] dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        URL_REGEX.test(part) ? (
          <a key={i} href={part} onClick={(e) => { e.preventDefault(); openUrl(part); }}
            className="text-indigo-500 underline underline-offset-2 hover:text-indigo-700 transition-colors cursor-pointer">
            {part}
          </a>
        ) : part
      )}
    </p>
  );
}
