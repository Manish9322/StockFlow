"use client"

import { useLanguage, type Language } from "@/lib/language-context"
import { Globe } from "lucide-react"

interface LanguageSwitcherProps {
  variant?: "button" | "dropdown"
}

export function LanguageSwitcher({ variant = "dropdown" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()

  const languages: Array<{ code: Language; label: string; flag: string }> = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "hi", label: "हिंदी", flag: "🇮🇳" },
  ]

  if (variant === "button") {
    return (
      <button
        onClick={() => setLanguage(language === "en" ? "hi" : "en")}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
        title={`Switch to ${language === "en" ? "Hindi" : "English"}`}
      >
        <Globe size={18} />
        <span>{language.toUpperCase()}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">Language</label>
      <div className="flex gap-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex-1 px-3 py-2 rounded-md border transition-colors text-sm font-medium ${
              language === lang.code
                ? "bg-foreground text-background border-foreground"
                : "border-border text-foreground hover:bg-muted"
            }`}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>
    </div>
  )
}
